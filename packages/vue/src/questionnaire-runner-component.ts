import { computed, defineComponent, h, shallowRef, watch, type PropType } from "vue";
import {
  useQuestionnaireRunner,
  type BeslismodelQuestionnaireRunnerStore,
  type BeslismodelRunnerOptionAnswer,
  type BeslismodelRunnerTransition,
  type StartQuestionnaireRunnerOptions,
} from "./questionnaire-runner";

export type BeslismodelQuestionnaireRunnerInstance = ReturnType<typeof useQuestionnaireRunner>;

export interface BeslismodelRunnerSelectableOption {
  readonly id?: string;
  readonly value: string;
  readonly text: string;
}

export interface BeslismodelQuestionnaireRunnerSlotProps {
  readonly runner: BeslismodelQuestionnaireRunnerInstance;
  readonly state: "idle" | "question" | "complete" | "missing";
  readonly transition: BeslismodelRunnerTransition | null;
  readonly question: BeslismodelQuestionnaireRunnerInstance["currentQuestion"]["value"];
  readonly step: BeslismodelQuestionnaireRunnerInstance["currentStep"]["value"];
  readonly progress: BeslismodelQuestionnaireRunnerInstance["progress"]["value"];
  readonly start: (options?: StartQuestionnaireRunnerOptions) => BeslismodelRunnerTransition;
  readonly advance: (branch?: string) => BeslismodelRunnerTransition;
  readonly goBack: () => BeslismodelRunnerTransition;
  readonly selectOption: (option: BeslismodelRunnerSelectableOption) => BeslismodelRunnerTransition;
  readonly toggleOption: (
    option: BeslismodelRunnerSelectableOption,
  ) => readonly BeslismodelRunnerOptionAnswer[];
  readonly confirmMultipleChoice: () => BeslismodelRunnerTransition;
}

type QuestionTransition = Extract<BeslismodelRunnerTransition, { type: "question" }>;
type CompleteTransition = Extract<BeslismodelRunnerTransition, { type: "complete" }>;
type MissingTransition = Extract<BeslismodelRunnerTransition, { type: "missing" }>;

export const QuestionnaireRunner = defineComponent({
  name: "QuestionnaireRunner",
  props: {
    store: {
      type: Object as PropType<BeslismodelQuestionnaireRunnerStore>,
      required: true,
    },
    questionnaireId: {
      type: String,
      required: true,
    },
    autoStart: {
      type: Boolean,
      default: true,
    },
    replayAnswers: {
      type: Boolean,
      default: true,
    },
  },
  emits: {
    transition: (_transition: BeslismodelRunnerTransition) => true,
    question: (_transition: QuestionTransition) => true,
    complete: (_transition: CompleteTransition) => true,
    missing: (_transition: MissingTransition) => true,
  },
  setup(props, { emit, expose, slots }) {
    const questionnaireId = computed(() => props.questionnaireId);
    const runner = useQuestionnaireRunner(props.store, { questionnaireId });
    const transition = shallowRef<BeslismodelRunnerTransition | null>(null);

    const emitTransition = (nextTransition: BeslismodelRunnerTransition) => {
      transition.value = nextTransition;
      emit("transition", nextTransition);
      if (nextTransition.type === "question") emit("question", nextTransition);
      if (nextTransition.type === "complete") emit("complete", nextTransition);
      if (nextTransition.type === "missing") emit("missing", nextTransition);
      return nextTransition;
    };

    const start = (options: StartQuestionnaireRunnerOptions = {}) =>
      emitTransition(
        runner.start({
          replayAnswers: props.replayAnswers,
          ...options,
        }),
      );

    const advance = (branch?: string) => emitTransition(runner.advance(branch));
    const goBack = () => emitTransition(runner.goBack());
    const selectOption = (option: BeslismodelRunnerSelectableOption) =>
      emitTransition(runner.selectOption(option));
    const toggleOption = (option: BeslismodelRunnerSelectableOption) => runner.toggleOption(option);
    const confirmMultipleChoice = () => emitTransition(runner.confirmMultipleChoice());

    const state = computed<BeslismodelQuestionnaireRunnerSlotProps["state"]>(() => {
      if (transition.value?.type === "missing") return "missing";
      if (transition.value?.type === "complete") return "complete";
      if (runner.currentQuestion.value) return "question";
      return "idle";
    });

    const slotProps = computed<BeslismodelQuestionnaireRunnerSlotProps>(() => ({
      advance,
      confirmMultipleChoice,
      goBack,
      progress: runner.progress.value,
      question: runner.currentQuestion.value,
      runner,
      selectOption,
      start,
      state: state.value,
      step: runner.currentStep.value,
      toggleOption,
      transition: transition.value,
    }));

    watch(
      [questionnaireId, runner.fullQuestionnaire],
      () => {
        if (props.autoStart) {
          start({ resetHistory: true });
        }
      },
      { immediate: true },
    );

    expose({
      advance,
      confirmMultipleChoice,
      goBack,
      runner,
      selectOption,
      start,
      toggleOption,
    });

    return () => {
      const currentSlotProps = slotProps.value;
      if (currentSlotProps.state === "missing") {
        return slots.missing?.(currentSlotProps) ?? slots.default?.(currentSlotProps) ?? null;
      }
      if (currentSlotProps.state === "complete") {
        return slots.complete?.(currentSlotProps) ?? slots.default?.(currentSlotProps) ?? null;
      }
      if (currentSlotProps.state === "question") {
        return slots.question?.(currentSlotProps) ?? slots.default?.(currentSlotProps) ?? null;
      }
      return (
        slots.default?.(currentSlotProps) ??
        h("div", {
          class: "bm-questionnaire-runner",
          "data-state": currentSlotProps.state,
        })
      );
    };
  },
});
