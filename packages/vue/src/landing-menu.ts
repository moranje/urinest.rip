import { computed, defineComponent, h, type PropType } from "vue";

export type BeslismodelLandingMenuSection = "primary" | "secondary";

export interface BeslismodelLandingMenuSource {
  readonly id: string;
  readonly name?: string;
  readonly title: string;
  readonly description?: string;
  readonly icon?: string;
  readonly hiddenFromLandingPage?: boolean;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface BeslismodelLandingMenuViewItem<
  Item extends BeslismodelLandingMenuSource = BeslismodelLandingMenuSource,
> {
  readonly item: Item;
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly icon?: string;
  readonly order: number;
  readonly section: BeslismodelLandingMenuSection;
}

export interface BeslismodelLandingMenuSections<
  Item extends BeslismodelLandingMenuSource = BeslismodelLandingMenuSource,
> {
  readonly primary: readonly BeslismodelLandingMenuViewItem<Item>[];
  readonly secondary: readonly BeslismodelLandingMenuViewItem<Item>[];
}

export interface CreateBeslismodelLandingMenuSectionsOptions {
  readonly iconKeys?: readonly string[];
}

export type BeslismodelLandingMenuPrefetcher<
  Item extends BeslismodelLandingMenuSource = BeslismodelLandingMenuSource,
> = (viewItem: BeslismodelLandingMenuViewItem<Item>) => void | Promise<void>;

const metadataString = (item: BeslismodelLandingMenuSource, key: string): string | undefined => {
  const value = item.metadata?.[key];
  return typeof value === "string" ? value : undefined;
};

const metadataNumber = (item: BeslismodelLandingMenuSource, key: string): number | undefined => {
  const value = item.metadata?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
};

const isLandingSection = (value: unknown): value is BeslismodelLandingMenuSection =>
  value === "primary" || value === "secondary";

export function getBeslismodelLandingMenuLabel(item: BeslismodelLandingMenuSource): string {
  return item.name ?? item.title;
}

export function getBeslismodelLandingMenuDescription(item: BeslismodelLandingMenuSource): string {
  return metadataString(item, "landingDescription") ?? item.description ?? "";
}

export function getBeslismodelLandingMenuOrder(item: BeslismodelLandingMenuSource): number {
  return metadataNumber(item, "landingOrder") ?? Number.MAX_SAFE_INTEGER;
}

export function getBeslismodelLandingMenuSection(
  item: BeslismodelLandingMenuSource,
  iconKeys: ReadonlySet<string> = new Set(),
): BeslismodelLandingMenuSection {
  const explicit = item.metadata?.landingSection;
  if (isLandingSection(explicit)) return explicit;
  if (item.icon && iconKeys.has(item.icon)) return "primary";
  return "secondary";
}

export function createBeslismodelLandingMenuSections<
  Item extends BeslismodelLandingMenuSource = BeslismodelLandingMenuSource,
>(
  items: readonly Item[],
  options: CreateBeslismodelLandingMenuSectionsOptions = {},
): BeslismodelLandingMenuSections<Item> {
  const iconKeys = new Set(options.iconKeys ?? []);
  const visibleItems = items
    .filter((item) => !item.hiddenFromLandingPage)
    .map((item) => ({
      item,
      id: item.id,
      label: getBeslismodelLandingMenuLabel(item),
      description: getBeslismodelLandingMenuDescription(item),
      icon: item.icon,
      order: getBeslismodelLandingMenuOrder(item),
      section: getBeslismodelLandingMenuSection(item, iconKeys),
    }))
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label, "nl"));

  return {
    primary: visibleItems.filter((item) => item.section === "primary"),
    secondary: visibleItems.filter((item) => item.section === "secondary"),
  };
}

export const LandingMenuGrid = defineComponent({
  name: "LandingMenuGrid",
  props: {
    items: {
      type: Array as PropType<readonly BeslismodelLandingMenuSource[]>,
      required: true,
    },
    iconKeys: {
      type: Array as PropType<readonly string[]>,
      default: () => [],
    },
    label: {
      type: String,
      default: "Questionnaire menu",
    },
    secondaryHeading: {
      type: String,
      default: "",
    },
    prefetchItem: {
      type: Function as PropType<BeslismodelLandingMenuPrefetcher>,
      default: undefined,
    },
  },
  emits: {
    prefetchError: (_error: unknown, _viewItem: BeslismodelLandingMenuViewItem) => true,
  },
  setup(props, { emit, slots }) {
    const sections = computed(() =>
      createBeslismodelLandingMenuSections(props.items, { iconKeys: props.iconKeys }),
    );
    const prefetchedIds = new Set<string>();

    const handlePrefetchFailure = (
      error: unknown,
      viewItem: BeslismodelLandingMenuViewItem,
    ): void => {
      prefetchedIds.delete(viewItem.id);
      emit("prefetchError", error, viewItem);
    };

    const prefetchOnIntent = (viewItem: BeslismodelLandingMenuViewItem): void => {
      if (!props.prefetchItem || prefetchedIds.has(viewItem.id)) return;
      prefetchedIds.add(viewItem.id);
      try {
        Promise.resolve(props.prefetchItem(viewItem)).catch((error: unknown) =>
          handlePrefetchFailure(error, viewItem),
        );
      } catch (error: unknown) {
        handlePrefetchFailure(error, viewItem);
      }
    };

    const intentListeners = (viewItem: BeslismodelLandingMenuViewItem) => ({
      onFocusin: () => prefetchOnIntent(viewItem),
      onMouseenter: () => prefetchOnIntent(viewItem),
      onTouchstart: () => prefetchOnIntent(viewItem),
    });

    const fallback = (viewItem: BeslismodelLandingMenuViewItem) =>
      h(
        "div",
        {
          class: "bm-landing-menu-grid__fallback",
        },
        viewItem.label,
      );

    const renderPrimary = (viewItem: BeslismodelLandingMenuViewItem) =>
      slots.primary?.({ item: viewItem.item, viewItem }) ?? fallback(viewItem);

    const renderSecondary = (viewItem: BeslismodelLandingMenuViewItem) =>
      slots.secondary?.({ item: viewItem.item, viewItem }) ?? fallback(viewItem);

    return () =>
      h(
        "section",
        {
          "aria-label": props.label,
          class: "bm-landing-menu-grid",
        },
        [
          h(
            "div",
            { class: "bm-landing-menu-grid__primary" },
            sections.value.primary.map((viewItem) =>
              h(
                "div",
                {
                  key: viewItem.id,
                  class: "bm-landing-menu-grid__primary-item",
                  ...intentListeners(viewItem),
                },
                renderPrimary(viewItem),
              ),
            ),
          ),
          sections.value.secondary.length > 0
            ? h("section", { class: "bm-landing-menu-grid__secondary" }, [
                props.secondaryHeading
                  ? h(
                      "h2",
                      { class: "bm-landing-menu-grid__secondary-heading" },
                      props.secondaryHeading,
                    )
                  : null,
                h(
                  "div",
                  { class: "bm-landing-menu-grid__secondary-items" },
                  sections.value.secondary.map((viewItem) =>
                    h(
                      "div",
                      {
                        key: viewItem.id,
                        class: "bm-landing-menu-grid__secondary-item",
                        ...intentListeners(viewItem),
                      },
                      renderSecondary(viewItem),
                    ),
                  ),
                ),
              ])
            : null,
        ],
      );
  },
});
