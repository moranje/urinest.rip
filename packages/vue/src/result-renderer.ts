import { computed, defineComponent, h, shallowRef, watch, type PropType } from "vue";
import {
  useResultResolver,
  type BeslismodelResolvedResult,
  type BeslismodelResultResolverStore,
  type ResolveBeslismodelResultOptions,
} from "./result-resolver";
import type { BeslismodelAnswerMap, BeslismodelOutcomeResult } from "./store";

export type BeslismodelResultRendererInstance = ReturnType<typeof useResultResolver>;

export interface BeslismodelResultRendererSlotProps {
  readonly resolver: BeslismodelResultRendererInstance;
  readonly state: "idle" | "result" | "redirect" | "none" | "error";
  readonly result: BeslismodelResolvedResult | null;
  readonly error: Error | null;
  readonly resolve: (options?: ResolveBeslismodelResultOptions) => BeslismodelResolvedResult | null;
}

type ResultState = BeslismodelResultRendererSlotProps["state"];

export const ResultRenderer = defineComponent({
  name: "ResultRenderer",
  props: {
    store: {
      type: Object as PropType<BeslismodelResultResolverStore>,
      required: true,
    },
    questionnaireId: {
      type: String,
      required: true,
    },
    answers: {
      type: Object as PropType<BeslismodelAnswerMap>,
      default: undefined,
    },
    autoResolve: {
      type: Boolean,
      default: true,
    },
    resolveKey: {
      type: [String, Number, Boolean] as PropType<string | number | boolean>,
      default: undefined,
    },
  },
  emits: {
    resolved: (_result: BeslismodelResolvedResult) => true,
    result: (_result: Extract<BeslismodelResolvedResult, { type: "result" }>) => true,
    redirect: (_result: Extract<BeslismodelResolvedResult, { type: "redirect" }>) => true,
    none: (_result: Extract<BeslismodelResolvedResult, { type: "none" }>) => true,
    error: (_error: Error) => true,
  },
  setup(props, { emit, expose, slots }) {
    const resolver = useResultResolver(props.store);
    const lastError = shallowRef<Error | null>(null);

    const resolve = (
      options: ResolveBeslismodelResultOptions = {},
    ): BeslismodelResolvedResult<BeslismodelOutcomeResult> | null => {
      lastError.value = null;
      try {
        const resolved = resolver.resolveResult(props.questionnaireId, {
          answers: props.answers,
          ...options,
        });
        emit("resolved", resolved);
        if (resolved.type === "result") emit("result", resolved);
        if (resolved.type === "redirect") emit("redirect", resolved);
        if (resolved.type === "none") emit("none", resolved);
        return resolved;
      } catch (caught) {
        const error = caught instanceof Error ? caught : new Error("Result resolution failed");
        lastError.value = error;
        emit("error", error);
        return null;
      }
    };

    const result = computed(() => resolver.lastResult.value);
    const error = computed(() => lastError.value ?? resolver.error.value);
    const state = computed<ResultState>(() => {
      if (error.value) return "error";
      if (!result.value) return "idle";
      return result.value.type;
    });

    const slotProps = computed<BeslismodelResultRendererSlotProps>(() => ({
      error: error.value,
      resolver,
      resolve,
      result: result.value,
      state: state.value,
    }));

    watch(
      [() => props.questionnaireId, () => props.answers, () => props.resolveKey],
      () => {
        if (props.autoResolve) resolve();
      },
      { immediate: true },
    );

    expose({
      resolve,
      resolver,
    });

    return () => {
      const currentSlotProps = slotProps.value;
      if (currentSlotProps.state === "error") {
        return slots.error?.(currentSlotProps) ?? slots.default?.(currentSlotProps) ?? null;
      }
      if (currentSlotProps.state === "result") {
        return slots.result?.(currentSlotProps) ?? slots.default?.(currentSlotProps) ?? null;
      }
      if (currentSlotProps.state === "redirect") {
        return slots.redirect?.(currentSlotProps) ?? slots.default?.(currentSlotProps) ?? null;
      }
      if (currentSlotProps.state === "none") {
        return slots.none?.(currentSlotProps) ?? slots.default?.(currentSlotProps) ?? null;
      }
      return (
        slots.default?.(currentSlotProps) ??
        h("div", {
          class: "bm-result-renderer",
          "data-state": currentSlotProps.state,
        })
      );
    };
  },
});
