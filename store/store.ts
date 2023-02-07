import { defineStore } from 'pinia';
import jsonData from '@/store/data.json';
import { migrate } from '@/components/migrate';
import { Namespace, Path } from '@/components/form-shared';

export type Link = {
  name: string;
  url: string;
};
export type TreatmentOption = {
  description: string;
  contraIndications: string[] | null;
  documentation: string;
  info?: string;
  additionalTest?: string;
  testAfterTreatment?: string;
};
export type Treatment = {
  treatment: TreatmentOption[];
  generalInfo?: string;
  explainer?: string;
  sources: Link[] | null;
};

type Version = {
  version: number;
};
export type Store = Version & {
  [Property in Namespace]: Treatment;
};

interface StoreState {
  data: Store;
  selectedPath: Path;
}

const data: Store = jsonData;
const STORE_NAME = 'us-store';

function getData(state: StoreState): Treatment;
function getData(state: StoreState, treatmentOnly: true): TreatmentOption;
function getData(state: StoreState, treatmentOnly: boolean = false) {
  const index = +(state.selectedPath.split('.').pop() || -1);
  const namespace = state.selectedPath.replace(/\.\d/, '') as Namespace; // remove last dot and digit

  if (!namespace) return null;

  // TODO: this may delete user changes
  if (state.data[namespace] == null) state.data = data;

  if (treatmentOnly === true) {
    return state.data[namespace].treatment[index] as TreatmentOption;
  }

  return state.data[namespace] as Treatment;
}

export const useStore = defineStore(STORE_NAME, {
  state: () => ({
    data: {} as Store,
    selectedPath: '' as Path,
  }),

  hydrate(state) {
    // TODO: this may delete user changes
    if (localStorage.getItem(STORE_NAME) == null) {
      state.data = data;
    } else if (state.data.version === data.version) {
      // State is up to date, do nothing
    } else {
      state.data = migrate(
        JSON.parse(localStorage.getItem(STORE_NAME)!).data,
        data
      );
    }
  },

  persist: {
    storage: persistedState.localStorage,
    paths: ['data', 'selectedPath'],
  },

  getters: {
    getSelectedNamespace: (state) => {
      return state.selectedPath.replace(/\.\d/, '') as Namespace;
    },
    getSelectedOption: (state) => {
      return +(state.selectedPath.split('.').pop() || -1);
    },
    getTreatment: (state) => {
      // if (state.selectedPath === '') return TREATMENT_SHIM;

      return getData(state);
    },
    getTreatmentOption: (state) => {
      // if (state.selectedPath === '') return TREATMENT_OPTION_SHIM;

      return getData(state, true) as TreatmentOption;
    },
  },

  actions: {
    setPath(path: Path) {
      this.selectedPath = path;
    },
    setTreatment(key: keyof Treatment, value: any) {
      this.data[this.getSelectedNamespace][key] = value;
    },
    setTreatmentOption(key: keyof TreatmentOption, value: any) {
      this.data[this.getSelectedNamespace].treatment[this.getSelectedOption][
        key
      ] = value;

      // useLocalStorage('us-store', this.data);
    },
  },
});
