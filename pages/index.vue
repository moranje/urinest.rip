<script lang="ts" setup>
  import MenuItem from '@/components/MenuItem.vue';
</script>

<template>
  <div class="vff vff-not-standalone">
    <div class="f-container">
      <div class="grid">
        <MenuItem
          v-slot="{ hover, touch }"
          to="/gezonde-vrouwen"
          name="Gezonde ♀"
          ><Healthy :hover="hover" :touch="touch"
        /></MenuItem>
        <MenuItem v-slot="{ hover, touch }" to="/strip" name="Urinestrip">
          <Strip :hover="hover" :touch="touch" />
        </MenuItem>
        <MenuItem v-slot="{ hover, touch }" to="/dipslide" name="Dipslide">
          <Dipslide :hover="hover" :touch="touch" />
        </MenuItem>
        <MenuItem v-slot="{ hover, touch }" to="/sediment" name="Sediment">
          <Sediment :hover="hover" :touch="touch" />
        </MenuItem>
        <MenuItem v-slot="{ hover, touch }" to="/kweek" name="Kweek">
          <Culture :hover="hover" :touch="touch"
        /></MenuItem>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 16em);
    grid-template-rows: repeat(2, 20em);
    grid-auto-flow: row;
    gap: 1em;
    justify-content: space-between;
    align-content: space-evenly;
  }

  .grid-item,
  .menu-item {
    /* border: thin gray solid; */
    /* padding: 10px; */
    height: 16em;
    overflow: hidden;
  }

  @media only screen and (max-width: 767px) {
    header.vff-header + .vff {
      margin-top: 4vh;
    }

    .grid {
      grid-template-columns: repeat(2, 14em);
      grid-template-rows: repeat(3, 20em);
    }
  }

  @media screen and (max-width: 479px) {
    header.vff-header + .vff {
      margin-top: 0;
    }

    .vff.vff-not-standalone {
      padding-top: 1em;
    }

    .grid {
      grid-template-columns: repeat(2, 12em);
      grid-template-rows: repeat(3, 16em);
    }
  }
</style>
