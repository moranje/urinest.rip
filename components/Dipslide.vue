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

  // const hover = ref(props.hover);
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 192 459"
    :class="{ dipslide: true, hover: props.hover, touch: props.touch }"
  >
    <path
      fill="#FFFCB6"
      d="m12.5 434.5-6-68.5 32 10.5 46 6 54-1.5 49-15-4 68.5-16 9-29 7.5-54
    3-46-6.5-26-13Z"
      class="test-color"
    />
    <path
      fill="#E9E9E9"
      d="m12 348-6.5 9.5L12 369l36 10 49 4 50.5-4 33-10 7.5-11.5-7.5-9.5-21-7H28l-16 7Z"
    />
    <ellipse
      cx="96"
      cy="358"
      stroke="#D3D3D3"
      stroke-linejoin="round"
      stroke-width="10"
      rx="91"
      ry="25"
    />
    <mask
      id="lid-mask"
      width="187"
      height="30"
      x="4"
      y="429"
      maskUnits="userSpaceOnUse"
      style="mask-type: alpha"
    >
      <path fill="#fff" d="M4 429h187v30H4z" />
    </mask>
    <g mask="url(#lid-mask)">
      <ellipse
        cx="97.5"
        cy="429"
        stroke="#D3D3D3"
        stroke-width="10"
        rx="86.5"
        ry="25"
      />
    </g>
    <path
      stroke="#D3D3D3"
      stroke-width="10"
      d="m4.982 357.579 6.063 71.744M186.995 358.184l-3.081 72.002"
    />
    <path fill="#E9E9E9" d="M40 275h112v80H40z" />
    <path
      fill="#AAA"
      d="M41 350h110v5H41v-5Z"
      style="mix-blend-mode: soft-light"
    />
    <path
      fill="#000"
      d="M41 309h110v5H41v-5ZM40 282h112v7H40v-7Z"
      style="mix-blend-mode: soft-light"
    />
    <rect
      width="122"
      height="56"
      x="35"
      y="304"
      stroke="#D3D3D3"
      stroke-linejoin="round"
      stroke-width="10"
      rx="16"
    />
    <path fill="#B43D3D" d="M40 10h112v265H40z" class="test-color" />
    <path
      fill="#000"
      d="M41 275a5 5 0 0 1 5-5h100a5 5 0 0 1 5 5H41Z"
      style="mix-blend-mode: soft-light"
    />
    <path
      fill="#AAA"
      d="M147 16a5 5 0 0 1 5-5v263a5 5 0 0 1-5-5V16ZM40 11a5 5 0 0 1 5 5v253a5 5 0 0 1-5 5V11Z"
      style="mix-blend-mode: soft-light"
    />
    <path
      fill="#E9E9E9"
      d="M41 10h110a5 5 0 0 1-5 5H46a5 5 0 0 1-5-5Z"
      style="mix-blend-mode: soft-light"
    />
    <rect
      width="122"
      height="275"
      x="35"
      y="5"
      stroke="#D3D3D3"
      stroke-width="10"
      rx="16"
    />
    <circle
      cx="115"
      cy="264"
      r="5"
      fill="#FFFCB6"
      class="test-positive culture-1"
    />
    <circle
      cx="66"
      cy="250"
      r="5"
      fill="#FFFCB6"
      class="test-positive culture-2"
    />
    <circle
      cx="88"
      cy="230"
      r="5"
      fill="#FFFCB6"
      class="test-positive culture-3"
    />
    <circle
      cx="140"
      cy="213"
      r="5"
      fill="#FFFCB6"
      class="test-positive culture-4"
    />
    <circle
      cx="64"
      cy="190"
      r="5"
      fill="#FFFCB6"
      class="test-positive culture-5"
    />
    <circle
      cx="123"
      cy="180"
      r="5"
      fill="#FFFCB6"
      class="test-positive culture-6"
    />
    <circle
      cx="98"
      cy="152"
      r="5"
      fill="#FFFCB6"
      class="test-positive culture-7"
    />
    <circle
      cx="54"
      cy="135"
      r="5"
      fill="#FFFCB6"
      class="test-positive culture-8"
    />
    <circle
      cx="135"
      cy="110"
      r="5"
      fill="#FFFCB6"
      class="test-positive culture-9"
    />
    <circle
      cx="101"
      cy="86"
      r="5"
      fill="#FFFCB6"
      class="test-positive culture-10"
    />
    <circle
      cx="69"
      cy="68"
      r="5"
      fill="#FFFCB6"
      class="test-positive culture-11"
    />
    <circle
      cx="123"
      cy="52"
      r="5"
      fill="#FFFCB6"
      class="test-positive culture-12"
    />
    <circle
      cx="59"
      cy="30"
      r="5"
      fill="#FFFCB6"
      class="test-positive culture-13"
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

  .dipslide {
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
        animation-delay: 0.5s;
      }
      .test-positive.culture-7 {
        animation-delay: 0.6s;
      }
      .test-positive.culture-8 {
        animation-delay: 0.7s;
      }
      .test-positive.culture-9 {
        animation-delay: 0.8s;
      }
      .test-positive.culture-10 {
        animation-delay: 0.9s;
      }
      .test-positive.culture-11 {
        animation-delay: 1s;
      }
      .test-positive.culture-12 {
        animation-delay: 1.1s;
      }
      .test-positive.culture-13 {
        animation-delay: 1.2s;
      }
    }
  }

  @media screen and (hover: none) {
    .dipslide:not(.touch) {
      .test-color,
      .test-positive {
        fill: #d3d3d3;
      }
    }
  }

  @media screen and (hover: hover) {
    .dipslide:not(.hover) {
      .test-color,
      .test-positive {
        fill: #d3d3d3;
      }
    }
  }
</style>
