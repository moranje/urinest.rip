<script lang="ts" setup>
  const props = withDefaults(
    defineProps<{
      hover?: boolean;
      touch?: boolean;
    }>(),
    {
      hover: false,
      touch: false,
    }
  );
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 582 582"
    :class="{ culture: true, hover: props.hover, touch: props.touch }"
  >
    <circle
      cx="291"
      cy="291"
      r="248.5"
      fill="#D3D3D3"
      fill-opacity=".1"
      stroke="#D3D3D3"
      stroke-width="3"
    />
    <circle
      cx="291"
      cy="291"
      r="268.5"
      stroke="#D3D3D3"
      stroke-opacity=".5"
      stroke-width="5"
      style="mix-blend-mode: overlay"
    />
    <circle
      cx="291"
      cy="291"
      r="278.5"
      stroke="#D3D3D3"
      stroke-opacity=".2"
      stroke-width="15"
    />
    <circle cx="291" cy="291" r="288.5" stroke="#D3D3D3" stroke-width="5" />
    <circle
      cx="159.5"
      cy="113.5"
      r="22.5"
      fill="#FFF174"
      class="test-positive culture-1"
    />
    <circle
      cx="333.5"
      cy="486.5"
      r="22.5"
      fill="#F1E78B"
      class="test-positive culture-2"
    />
    <circle
      cx="114.5"
      cy="227.5"
      r="22.5"
      fill="#F0E68E"
      class="test-positive culture-3"
    />
    <circle
      cx="92.5"
      cy="357.5"
      r="22.5"
      fill="#F4EB9A"
      class="test-positive culture-4"
    />
    <circle
      cx="305.5"
      cy="301.5"
      r="22.5"
      fill="#FFF174"
      class="test-positive culture-5"
    />
    <circle
      cx="260.5"
      cy="313.5"
      r="22.5"
      fill="#F1E892"
      class="test-positive culture-6"
    />
    <circle
      cx="180.5"
      cy="365.5"
      r="32.5"
      fill="#FFD494"
      class="test-positive culture-7"
    />
    <circle
      cx="433.5"
      cy="158.5"
      r="32.5"
      fill="#FFF174"
      class="test-positive culture-8"
    />
    <circle
      cx="228.5"
      cy="113.5"
      r="32.5"
      fill="#ECE6B3"
      class="test-positive culture-9"
    />
    <circle
      cx="251.5"
      cy="449.5"
      r="32.5"
      fill="#FFA674"
      class="test-positive culture-10"
    />
    <circle
      cx="237.5"
      cy="497.5"
      r="32.5"
      fill="#FFF174"
      class="test-positive culture-11"
    />
    <circle
      cx="200.5"
      cy="172.5"
      r="27.5"
      fill="#FFC774"
      class="test-positive culture-12"
    />
    <circle
      cx="228.5"
      cy="190.5"
      r="22.5"
      fill="#FFF174"
      class="test-positive culture-13"
    />
    <circle
      cx="251.5"
      cy="168.5"
      r="22.5"
      fill="#EDE59C"
      class="test-positive culture-14"
    />
    <circle
      cx="273.5"
      cy="135.5"
      r="22.5"
      fill="#FFF174"
      class="test-positive culture-15"
    />
    <circle
      cx="282.5"
      cy="78.5"
      r="22.5"
      fill="#FFF174"
      class="test-positive culture-16"
    />
    <circle
      cx="441"
      cy="345"
      r="50"
      fill="#EAE18F"
      class="test-positive culture-17"
    />
    <circle
      cx="483.5"
      cy="379.5"
      r="22.5"
      fill="#FFF174"
      class="test-positive culture-18"
    />
    <circle
      cx="194.5"
      cy="481.5"
      r="22.5"
      fill="#FBD9C5"
      class="test-positive culture-19"
    />
    <circle
      cx="130.5"
      cy="279.5"
      r="22.5"
      fill="#FFF174"
      class="test-positive culture-20"
    />
    <circle
      cx="78.5"
      cy="272.5"
      r="22.5"
      fill="#E9DE79"
      class="test-positive culture-21"
    />
    <circle
      cx="355.5"
      cy="167.5"
      r="12.5"
      fill="#FFAE74"
      class="test-positive culture-22"
    />
    <circle
      cx="317.5"
      cy="429.5"
      r="12.5"
      fill="#FFF174"
      class="test-positive culture-23"
    />
    <circle
      cx="269.5"
      cy="345.5"
      r="12.5"
      fill="#DE551A"
      class="test-positive culture-24"
    />
    <circle
      cx="290.5"
      cy="429.5"
      r="12.5"
      fill="#CE6240"
      class="test-positive culture-25"
    />
    <circle
      cx="296.5"
      cy="458.5"
      r="12.5"
      fill="#FFF174"
      class="test-positive culture-26"
    />
    <circle
      cx="346.5"
      cy="113.5"
      r="12.5"
      fill="#F6EC91"
      class="test-positive culture-27"
    />
    <circle
      cx="340.5"
      cy="217.5"
      r="12.5"
      fill="#FFF174"
      class="test-positive culture-28"
    />
    <circle
      cx="172.5"
      cy="260.5"
      r="12.5"
      fill="#DD4E2F"
      class="test-positive culture-29"
    />
    <circle
      cx="160.5"
      cy="189.5"
      r="12.5"
      fill="#FFF174"
      class="test-positive culture-30"
    />
    <circle
      cx="197.5"
      cy="225.5"
      r="12.5"
      fill="#FFF174"
      class="test-positive culture-31"
    />
    <circle
      cx="308.5"
      cy="356.5"
      r="12.5"
      fill="#FFF174"
      class="test-positive culture-32"
    />
  </svg>
</template>

<style lang="scss" scoped>
  @keyframes show {
    0% {
      opacity: 1;
    }
    100% {
      opacity: 1;
    }
  }

  .culture {
    height: 10em;

    &.hover {
      .test-positive {
        opacity: 0;
        animation-name: show;
        animation-duration: 2s;
        animation-fill-mode: forwards;
        animation-iteration-count: 1;
      }

      .test-positive.culture-1 {
        animation-delay: 0s;
      }
      .test-positive.culture-2 {
        animation-delay: 0.1s;
      }
      .test-positive.culture-3 {
        animation-delay: 0.2s;
      }
      .test-positive.culture-4 {
        animation-delay: 0.3s;
      }
      .test-positive.culture-5 {
        animation-delay: 0.4s;
      }
      .test-positive.culture-6 {
        animation-delay: 0.1s;
      }
      .test-positive.culture-7 {
        animation-delay: 0.4s;
      }
      .test-positive.culture-8 {
        animation-delay: 0.5s;
      }
      .test-positive.culture-9 {
        animation-delay: 0.6s;
      }
      .test-positive.culture-10 {
        animation-delay: 0.7s;
      }
      .test-positive.culture-11 {
        animation-delay: 0.5s;
      }
      .test-positive.culture-12 {
        animation-delay: 0.6s;
      }
      .test-positive.culture-13 {
        animation-delay: 0.7s;
      }
      .test-positive.culture-14 {
        animation-delay: 0.8s;
      }
      .test-positive.culture-15 {
        animation-delay: 0.9s;
      }
      .test-positive.culture-16 {
        animation-delay: 1s;
      }
      .test-positive.culture-17 {
        animation-delay: 1.1s;
      }
      .test-positive.culture-18 {
        animation-delay: 0.9s;
      }
      .test-positive.culture-19 {
        animation-delay: 1s;
      }
      .test-positive.culture-20 {
        animation-delay: 1.1s;
      }
      .test-positive.culture-21 {
        animation-delay: 1.2s;
      }
      .test-positive.culture-22 {
        animation-delay: 1.3s;
      }
      .test-positive.culture-23 {
        animation-delay: 1.2s;
      }
      .test-positive.culture-24 {
        animation-delay: 1.3s;
      }
      .test-positive.culture-25 {
        animation-delay: 1.4s;
      }
      .test-positive.culture-26 {
        animation-delay: 1.5s;
      }
      .test-positive.culture-27 {
        animation-delay: 1.6s;
      }
      .test-positive.culture-28 {
        animation-delay: 1.7s;
      }
      .test-positive.culture-29 {
        animation-delay: 1.8s;
      }
      .test-positive.culture-30 {
        animation-delay: 1.9s;
      }
      .test-positive.culture-31 {
        animation-delay: 1.8s;
      }
      .test-positive.culture-32 {
        animation-delay: 2s;
      }
    }
  }

  @media screen and (hover: none) {
    .culture:not(.touch) {
      .test-color,
      .test-positive {
        fill: #d3d3d3;
      }
    }
  }

  @media screen and (hover: hover) {
    .culture:not(.hover) {
      .test-color,
      .test-positive {
        fill: #d3d3d3;
      }
    }
  }
</style>
