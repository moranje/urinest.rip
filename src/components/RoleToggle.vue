<template>
  <SegmentedControl
    :model-value="role"
    :options="roleOptions"
    label="Rol selectie"
    size="sm"
    @update:model-value="setRole($event as UserRole)"
  />
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import SegmentedControl from "./molecules/SegmentedControl.vue";
import { useRoleStore } from "../store/roleStore";
import type { UserRole } from "../types";

type SegmentedOptions = InstanceType<typeof SegmentedControl>["$props"]["options"];

const roleStore = useRoleStore();
const { role } = storeToRefs(roleStore);
const { setRole } = roleStore;

const roleOptions: SegmentedOptions = [
  { value: "behandelaar", label: "Arts" },
  { value: "triagist", label: "Triage" },
];
</script>
