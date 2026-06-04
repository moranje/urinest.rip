import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const REQUIRED_RUNTIME_ROLES = ["behandelaar", "triagist"];
const REQUIRED_CARE_ROLES = ["arts", "triagist", "doktersassistent", "verpleegkundige", "poh"];
const ALLOWED_CARE_ROLE_STATUS = new Set(["covered-by-runtime-mode", "not-exposed"]);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function fail(errors, message) {
  errors.push(message);
}

function assertNonEmptyString(errors, path, value) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(errors, `${path}: must be a non-empty string`);
  }
}

function assertStringArray(errors, path, value, { allowEmpty = false } = {}) {
  if (!Array.isArray(value)) {
    fail(errors, `${path}: must be an array`);
    return;
  }
  if (!allowEmpty && value.length === 0) {
    fail(errors, `${path}: must not be empty`);
  }
  for (const [index, entry] of value.entries()) {
    if (typeof entry !== "string" || entry.trim() === "") {
      fail(errors, `${path}[${index}]: must be a non-empty string`);
    }
  }
}

function extractUserRoleValues(source) {
  const match = source.match(/type\s+UserRole\s*=\s*([^;]+);/u);
  if (!match) return [];
  return [...match[1].matchAll(/"([^"]+)"/gu)].map((roleMatch) => roleMatch[1]).sort();
}

function normalizeAnswer(value) {
  if (Array.isArray(value)) return value.map((entry) => normalizeAnswer(entry));
  if (isRecord(value) && "value" in value) return value.value;
  return value;
}

function hasValue(value) {
  return value !== undefined && value !== null;
}

function stringEquals(left, right) {
  return String(left) === String(right);
}

function evaluateCondition(condition, answers) {
  if (!isRecord(condition)) return false;
  const answer = answers[condition.questionId];
  if (!hasValue(answer)) return false;
  const actual = normalizeAnswer(answer);
  const expected = condition.value;

  switch (condition.operator) {
    case "equals":
    case "eq":
      return stringEquals(actual, expected);
    case "not_equals":
    case "neq":
      return !stringEquals(actual, expected);
    case "includes":
      return Array.isArray(actual) && actual.some((item) => stringEquals(item, expected));
    case "not_includes":
      return Array.isArray(actual) && !actual.some((item) => stringEquals(item, expected));
    case "in":
      return Array.isArray(expected) && expected.some((item) => stringEquals(item, actual));
    case "not_in":
      return Array.isArray(expected) && !expected.some((item) => stringEquals(item, actual));
    default:
      return false;
  }
}

function conditionsMatch(conditions, answers) {
  const entries = Array.isArray(conditions) ? conditions : [];
  const matched = entries.every((condition) => evaluateCondition(condition, answers));
  return { matched, count: entries.length };
}

function getQuestionOrder(questionnaire) {
  const stepQuestionIds = (questionnaire.steps ?? []).flatMap((step) =>
    Array.isArray(step.questionIds) ? step.questionIds : [],
  );
  if (stepQuestionIds.length > 0) return stepQuestionIds;
  return (questionnaire.questions ?? []).map((question) => question.id);
}

function findNextReachableQuestion(questionnaire, answers) {
  const questionsById = new Map(
    (questionnaire.questions ?? []).map((question) => [question.id, question]),
  );
  for (const questionId of getQuestionOrder(questionnaire)) {
    if (Object.hasOwn(answers, questionId)) continue;
    const question = questionsById.get(questionId);
    if (!question) continue;
    if (conditionsMatch(question.conditions, answers).matched) return question;
  }
  return null;
}

function determineManifestOutcome(questionnaire, answers) {
  let bestRule = null;
  let bestMatchedCount = -1;

  for (const rule of questionnaire.resultsLogic ?? []) {
    const { matched, count } = conditionsMatch(rule.conditions, answers);
    if (matched && count > bestMatchedCount) {
      bestRule = rule;
      bestMatchedCount = count;
    }
  }

  bestRule ??= (questionnaire.resultsLogic ?? []).find((rule) => !rule.conditions?.length) ?? null;
  if (!bestRule) return { type: "none" };
  if (bestRule.redirectToQuestionnaire) {
    return { type: "redirect", target: bestRule.redirectToQuestionnaire };
  }
  if (bestRule.resultKey) return { type: "result", key: bestRule.resultKey };
  return { type: "none" };
}

function getQuestionAnswerVariants(question) {
  const options = question.options ?? [];
  if (question.type !== "multi_select" && question.type !== "multiple") {
    return options.map((option) => option.value);
  }

  if (options.length > 10) {
    throw new Error(
      `Question "${question.id}" has ${options.length} multi-select options; role matrix enumeration supports at most 10.`,
    );
  }

  const values = options.map((option) => option.value);
  const variants = [];
  const total = 2 ** values.length;
  for (let mask = 0; mask < total; mask += 1) {
    variants.push(values.filter((_, index) => (mask & (1 << index)) !== 0));
  }
  return variants;
}

function formatAnswerValue(value) {
  return Array.isArray(value) ? `[${value.join(",")}]` : String(value);
}

function enumerateQuestionnairePaths(questionnaire, role, maxPaths = 20000) {
  const paths = [];
  const initialAnswers = { _role: role };
  const visit = (answers, trail) => {
    if (paths.length >= maxPaths) return;
    const question = findNextReachableQuestion(questionnaire, answers);
    if (!question) {
      paths.push({ answers, outcome: determineManifestOutcome(questionnaire, answers), trail });
      return;
    }
    paths.push({ answers, question, trail });
    for (const value of getQuestionAnswerVariants(question)) {
      visit({ ...answers, [question.id]: value }, [
        ...trail,
        `${question.id}=${formatAnswerValue(value)}`,
      ]);
    }
  };

  visit(initialAnswers, []);
  return paths;
}

function matchesAnyPattern(value, patterns) {
  if (typeof value !== "string") return false;
  return patterns.some((pattern) => value.toLocaleLowerCase("nl-NL").includes(pattern));
}

function validateRuntimeRoles(errors, matrix) {
  const runtimeRoles = matrix.runtimeRoles;
  const careRoles = matrix.careRoles;
  if (!isRecord(runtimeRoles)) {
    fail(errors, "runtimeRoles: must be an object");
    return;
  }
  if (!isRecord(careRoles)) {
    fail(errors, "careRoles: must be an object");
    return;
  }

  for (const role of REQUIRED_RUNTIME_ROLES) {
    const runtimeRole = runtimeRoles[role];
    const path = `runtimeRoles.${role}`;
    if (!isRecord(runtimeRole)) {
      fail(errors, `${path}: missing required runtime role`);
      continue;
    }
    assertNonEmptyString(errors, `${path}.label`, runtimeRole.label);
    if (runtimeRole.exposedInApp !== true) {
      fail(errors, `${path}.exposedInApp: required runtime roles must be exposed in the app`);
    }
    if (typeof runtimeRole.canSeeTreatment !== "boolean") {
      fail(errors, `${path}.canSeeTreatment: must be boolean`);
    }
    if (typeof runtimeRole.canDocumentTreatment !== "boolean") {
      fail(errors, `${path}.canDocumentTreatment: must be boolean`);
    }
    assertStringArray(errors, `${path}.careRoles`, runtimeRole.careRoles);
    assertStringArray(errors, `${path}.responsibilities`, runtimeRole.responsibilities);
    assertStringArray(errors, `${path}.forbiddenActions`, runtimeRole.forbiddenActions, {
      allowEmpty: true,
    });

    for (const careRoleName of asArray(runtimeRole.careRoles)) {
      const careRole = careRoles[careRoleName];
      if (!isRecord(careRole)) {
        fail(errors, `${path}.careRoles: unknown care role "${careRoleName}"`);
        continue;
      }
      if (careRole.runtimeRole !== role) {
        fail(
          errors,
          `careRoles.${careRoleName}.runtimeRole: expected "${role}" because it is mapped by ${path}`,
        );
      }
      if (careRole.canSeeTreatment === true && runtimeRole.canSeeTreatment !== true) {
        fail(errors, `careRoles.${careRoleName}: cannot see treatment through ${path}`);
      }
      if (careRole.canDocumentTreatment === true && runtimeRole.canDocumentTreatment !== true) {
        fail(errors, `careRoles.${careRoleName}: cannot document treatment through ${path}`);
      }
    }
  }

  for (const [role, runtimeRole] of Object.entries(runtimeRoles)) {
    if (!isRecord(runtimeRole)) {
      fail(errors, `runtimeRoles.${role}: must be an object`);
    }
  }
}

function validateCareRoles(errors, matrix) {
  const runtimeRoles = matrix.runtimeRoles;
  const careRoles = matrix.careRoles;
  if (!isRecord(runtimeRoles) || !isRecord(careRoles)) return;

  for (const role of REQUIRED_CARE_ROLES) {
    const careRole = careRoles[role];
    const path = `careRoles.${role}`;
    if (!isRecord(careRole)) {
      fail(errors, `${path}: missing required care role`);
      continue;
    }
    assertNonEmptyString(errors, `${path}.label`, careRole.label);
    if (!ALLOWED_CARE_ROLE_STATUS.has(careRole.status)) {
      fail(errors, `${path}.status: unsupported status "${careRole.status}"`);
    }
    if (typeof careRole.canSeeTreatment !== "boolean") {
      fail(errors, `${path}.canSeeTreatment: must be boolean`);
    }
    if (typeof careRole.canDocumentTreatment !== "boolean") {
      fail(errors, `${path}.canDocumentTreatment: must be boolean`);
    }
    assertStringArray(errors, `${path}.responsibilities`, careRole.responsibilities);
    assertStringArray(errors, `${path}.mustEscalateWhen`, careRole.mustEscalateWhen, {
      allowEmpty: role === "arts",
    });

    if (careRole.status === "covered-by-runtime-mode") {
      if (typeof careRole.runtimeRole !== "string" || !runtimeRoles[careRole.runtimeRole]) {
        fail(errors, `${path}.runtimeRole: must reference an existing runtime role`);
      }
      continue;
    }

    if (careRole.runtimeRole !== null) {
      fail(errors, `${path}.runtimeRole: not-exposed roles must use null`);
    }
    if (careRole.canSeeTreatment !== false || careRole.canDocumentTreatment !== false) {
      fail(errors, `${path}: not-exposed roles must not see or document treatment`);
    }
  }
}

function validateAudiencePolicy(errors, matrix, manifest) {
  const policy = matrix.questionnaireAudiencePolicy;
  const runtimeRoles = matrix.runtimeRoles;
  if (!isRecord(policy)) {
    fail(errors, "questionnaireAudiencePolicy: must be an object");
    return;
  }
  const allowedAudienceValues = policy.allowedAudienceValues;
  assertStringArray(
    errors,
    "questionnaireAudiencePolicy.allowedAudienceValues",
    allowedAudienceValues,
  );
  assertStringArray(
    errors,
    "questionnaireAudiencePolicy.notExposedCareRoles",
    policy.notExposedCareRoles,
    {
      allowEmpty: true,
    },
  );
  assertStringArray(
    errors,
    "questionnaireAudiencePolicy.treatmentHiddenForRuntimeRoles",
    policy.treatmentHiddenForRuntimeRoles,
    { allowEmpty: true },
  );

  const allowedAudienceSet = new Set(asArray(allowedAudienceValues));
  for (const role of allowedAudienceSet) {
    if (!runtimeRoles?.[role]) {
      fail(
        errors,
        `questionnaireAudiencePolicy.allowedAudienceValues: unknown runtime role "${role}"`,
      );
    }
  }

  const questionnaires = manifest?.questionnaires;
  if (!Array.isArray(questionnaires)) {
    fail(errors, "manifest.questionnaires: must be an array");
    return;
  }

  for (const questionnaire of questionnaires) {
    const audience = questionnaire?.audience;
    const flowPath = `questionnaires.${questionnaire?.id ?? "unknown"}.audience`;
    if (!Array.isArray(audience) || audience.length === 0) {
      fail(errors, `${flowPath}: must be a non-empty array`);
      continue;
    }
    for (const role of audience) {
      if (!allowedAudienceSet.has(role)) {
        fail(errors, `${flowPath}: role "${role}" is not allowed by matrix policy`);
      }
      if (!runtimeRoles?.[role]?.exposedInApp) {
        fail(errors, `${flowPath}: role "${role}" is not exposed in the app`);
      }
    }
  }
}

function validateReachableResponsibility(errors, matrix, manifest) {
  const policy = matrix.questionnaireAudiencePolicy;
  if (!isRecord(policy)) return;
  const hiddenTreatmentRoles = new Set(asArray(policy.treatmentHiddenForRuntimeRoles));
  const forbiddenQuestionPatterns = asArray(policy.forbiddenTreatmentQuestionPatterns).map(
    (pattern) => pattern.toLocaleLowerCase("nl-NL"),
  );
  const forbiddenResultFields = new Set(asArray(policy.forbiddenTreatmentResultFields));
  const requireResolvedOutcome = policy.requireResolvedOutcomeForRuntimeRoles === true;
  const questionnaires = manifest?.questionnaires;
  if (!Array.isArray(questionnaires)) return;

  for (const questionnaire of questionnaires) {
    const roles = Array.isArray(questionnaire.audience) ? questionnaire.audience : [];
    for (const role of roles) {
      const hiddenTreatment = hiddenTreatmentRoles.has(role);
      const paths = enumerateQuestionnairePaths(questionnaire, role);
      for (const path of paths) {
        const prefix = `questionnaires.${questionnaire.id}.${role}`;
        const trail = path.trail.length > 0 ? path.trail.join(" > ") : "start";

        if (path.question && hiddenTreatment) {
          if (matchesAnyPattern(path.question.text, forbiddenQuestionPatterns)) {
            fail(
              errors,
              `${prefix}: forbidden treatment question "${path.question.id}" reachable at ${trail}`,
            );
          }
          continue;
        }

        if (!path.outcome) continue;
        if (path.outcome.type === "none") {
          if (requireResolvedOutcome) {
            fail(errors, `${prefix}: unresolved dead end reachable at ${trail}`);
          }
          continue;
        }
        if (path.outcome.type !== "result" || !hiddenTreatment) continue;

        const result = questionnaire.results?.[path.outcome.key];
        if (!isRecord(result)) {
          fail(errors, `${prefix}: outcome result "${path.outcome.key}" is missing at ${trail}`);
          continue;
        }
        for (const field of forbiddenResultFields) {
          if (Object.hasOwn(result, field)) {
            fail(
              errors,
              `${prefix}: forbidden treatment result "${path.outcome.key}" exposes field "${field}" at ${trail}`,
            );
          }
        }
      }
    }
  }
}

function validateRuntimeRoleSources(errors, matrix, roleToggleSource, userTypesSource) {
  const runtimeRoles = matrix.runtimeRoles;
  if (!isRecord(runtimeRoles)) return;

  const typeRoles = extractUserRoleValues(userTypesSource);
  const runtimeRoleNames = Object.keys(runtimeRoles).sort();
  if (JSON.stringify(typeRoles) !== JSON.stringify(runtimeRoleNames)) {
    fail(
      errors,
      `src/types/index.ts UserRole mismatch: expected ${JSON.stringify(runtimeRoleNames)}, got ${JSON.stringify(typeRoles)}`,
    );
  }

  for (const [role, runtimeRole] of Object.entries(runtimeRoles)) {
    const label = runtimeRole?.label;
    if (typeof label !== "string") continue;
    const optionPattern = new RegExp(
      String.raw`\{\s*value:\s*"${role}"\s*,\s*label:\s*"${label}"\s*\}`,
      "u",
    );
    if (!optionPattern.test(roleToggleSource)) {
      fail(errors, `src/components/RoleToggle.vue: missing option ${role} (${label})`);
    }
  }
}

export function validateRoleResponsibilityMatrix({
  matrix,
  manifest,
  roleToggleSource = "",
  userTypesSource = "",
}) {
  const errors = [];
  if (!isRecord(matrix)) {
    return ["matrix: must be an object"];
  }
  if (matrix.schema !== "role-responsibility-matrix-v1") {
    fail(errors, 'schema: must be "role-responsibility-matrix-v1"');
  }
  assertNonEmptyString(errors, "reviewedOn", matrix.reviewedOn);
  assertNonEmptyString(errors, "scope", matrix.scope);
  validateRuntimeRoles(errors, matrix);
  validateCareRoles(errors, matrix);
  validateAudiencePolicy(errors, matrix, manifest);
  validateReachableResponsibility(errors, matrix, manifest);
  validateRuntimeRoleSources(errors, matrix, roleToggleSource, userTypesSource);
  return errors;
}

function runCli() {
  const matrix = JSON.parse(
    readFileSync(new URL("../docs/role-responsibility-matrix.json", import.meta.url), "utf8"),
  );
  const manifest = JSON.parse(
    readFileSync(new URL("../public/main.json", import.meta.url), "utf8"),
  );
  const roleToggleSource = readFileSync(
    new URL("../src/components/RoleToggle.vue", import.meta.url),
    "utf8",
  );
  const userTypesSource = readFileSync(new URL("../src/types/index.ts", import.meta.url), "utf8");

  const errors = validateRoleResponsibilityMatrix({
    manifest,
    matrix,
    roleToggleSource,
    userTypesSource,
  });

  if (errors.length > 0) {
    console.error("Role responsibility matrix check failed:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log("Role responsibility matrix check passed.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
