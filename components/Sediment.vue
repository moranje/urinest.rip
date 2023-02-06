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
    viewBox="0 0 267 411"
    :class="{ sediment: true, hover: props.hover, touch: props.touch }"
  >
    <mask
      id="lamp"
      width="110"
      height="19"
      x="65"
      y="356"
      maskUnits="userSpaceOnUse"
      style="mask-type: alpha"
    >
      <rect
        width="105"
        height="14"
        x="67.5"
        y="358.5"
        fill="#D9D9D9"
        stroke="#D3D3D3"
        stroke-linejoin="round"
        stroke-width="5"
        rx="4.5"
      />
    </mask>
    <g mask="url(#lamp)">
      <path
        fill="#FFFCB6"
        stroke="#D3D3D3"
        stroke-width="5"
        d="M158.5 375c0 1.075-.587 2.417-2.357 3.948-1.764 1.525-4.461 3.012-8.011
      4.311-7.079 2.59-17.025 4.241-28.132 4.241-11.107
      0-21.053-1.651-28.132-4.241-3.55-1.299-6.247-2.786-8.01-4.311-1.77-1.531-2.358-2.873-2.358-3.948
      0-1.075.587-2.417 2.358-3.948 1.763-1.525 4.46-3.012 8.01-4.311 7.079-2.59
      17.025-4.241 28.132-4.241 11.107 0 21.053 1.651 28.132 4.241 3.55 1.299
      6.247 2.786 8.011 4.311 1.77 1.531 2.357 2.873 2.357 3.948Z"
        class="test-positive"
      />
    </g>
    <rect
      width="86"
      height="13"
      x="76.5"
      y="376.5"
      fill="#AAA"
      stroke="#D3D3D3"
      stroke-width="5"
      rx="4.5"
      class="test-color"
    />
    <rect
      width="68"
      height="115"
      x="85.5"
      y="115.5"
      fill="#E9E9E9"
      stroke="#D3D3D3"
      stroke-linejoin="round"
      stroke-width="5"
      rx="4.5"
    />
    <rect
      width="55"
      height="10"
      x="92.5"
      y="105.5"
      fill="#AAA"
      stroke="#D3D3D3"
      stroke-linejoin="round"
      stroke-width="5"
      rx="4.5"
      class="test-color"
    />
    <path
      fill="#E9E9E9"
      stroke="#D3D3D3"
      stroke-linejoin="round"
      stroke-width="5"
      d="m76.78 72.163 62.288-35.341a4.499 4.499 0 0 1 5.422.752l33.712 34.138a4.499 4.499 0 0 1 1.298 3.162V101a4.5 4.5 0 0 1-4.5 4.5H79a4.5 4.5 0 0 1-4.5-4.5V76.077a4.5 4.5 0 0 1 2.28-3.914Z"
    />
    <rect
      width="55.756"
      height="34.881"
      x="148.364"
      y="41.193"
      fill="#AAA"
      stroke="#D3D3D3"
      stroke-linejoin="round"
      stroke-width="5"
      rx="4.5"
      transform="rotate(-45.655 148.364 41.193)"
      class="test-color"
    />
    <rect
      width="105"
      height="11"
      x="67.5"
      y="230.5"
      fill="#AAA"
      stroke="#D3D3D3"
      stroke-linejoin="round"
      stroke-width="5"
      rx="4.5"
      class="test-color"
    />
    <rect
      width="172"
      height="11"
      x="33.5"
      y="331.5"
      fill="#AAA"
      stroke="#D3D3D3"
      stroke-linejoin="round"
      stroke-width="5"
      rx="4.5"
      class="test-color"
    />
    <mask
      id="frame-mask"
      width="110"
      height="14"
      x="65"
      y="244"
      maskUnits="userSpaceOnUse"
      style="mask-type: alpha"
    >
      <rect
        width="105"
        height="9"
        x="67.5"
        y="246.5"
        fill="#D9D9D9"
        stroke="#D3D3D3"
        stroke-linejoin="round"
        stroke-width="5"
        rx="4.5"
      />
    </mask>
    <g mask="url(#frame-mask)">
      <path
        fill="#E9E9E9"
        stroke="#D3D3D3"
        stroke-width="5"
        d="M158.5 243c0 1.075-.587 2.417-2.357 3.948-1.764 1.525-4.461 3.012-8.011 4.311-7.079 2.59-17.025 4.241-28.132 4.241-11.107 0-21.053-1.651-28.132-4.241-3.55-1.299-6.247-2.786-8.01-4.311-1.77-1.531-2.358-2.873-2.358-3.948 0-1.075.587-2.417 2.358-3.948 1.763-1.525 4.46-3.012 8.01-4.311 7.079-2.59 17.025-4.241 28.132-4.241 11.107 0 21.053 1.651 28.132 4.241 3.55 1.299 6.247 2.786 8.011 4.311 1.77 1.531 2.357 2.873 2.357 3.948Z"
      />
    </g>
    <rect
      width="24"
      height="28"
      x="107.5"
      y="255.5"
      fill="#AAA"
      stroke="#D3D3D3"
      stroke-linejoin="round"
      stroke-width="5"
      rx="4.5"
      class="test-color"
    />
    <path
      fill="#E9E9E9"
      stroke="#D3D3D3"
      stroke-width="5"
      d="M173.5 120H161a7 7 0 0 0-7 7v74.5a7 7 0 0 0 7 7h12.5a7 7 0 0 0 7-7v-1.995c0-4.237 3.735-7.502 7.934-6.937l12.186 1.64a7 7 0 0 1 6.062 6.723l5.596 181.854a7 7 0 0 1-6.997 7.215H9.5a7 7 0 0 0-7 7v4.5a7 7 0 0 0 7 7h247.334a7 7 0 0 0 6.998-7.164l-4.787-204.403a6.987 6.987 0 0 0-1.076-3.568l-20.783-32.982a6.991 6.991 0 0 0-3.242-2.735L184.82 137.29a7 7 0 0 1-4.32-6.466V127a7 7 0 0 0-7-7Z"
    />
    <circle
      cx="191"
      cy="170"
      r="13.5"
      fill="#AAA"
      stroke="#D3D3D3"
      stroke-width="5"
      class="test-color"
    />
    <circle
      cx="237"
      cy="345"
      r="18.5"
      fill="#AAA"
      stroke="#D3D3D3"
      stroke-width="5"
      class="test-color"
    />
  </svg>
</template>

<style lang="scss" scoped>
  @keyframes light {
    0% {
      fill: #d3d3d3;
    }
    100% {
      fill: #fffcb6;
    }
  }

  .sediment {
    height: 10em;

    &.hover {
      .test-positive {
        animation-name: light;
        animation-duration: 3s;
        animation-fill-mode: forwards;
        animation-iteration-count: 1;
      }
    }
  }

  @media screen and (hover: none) {
    .sediment:not(.touch) {
      .test-color,
      .test-positive {
        fill: #d3d3d3;
      }
    }
  }

  @media screen and (hover: hover) {
    .sediment:not(.hover) {
      .test-color,
      .test-positive {
        fill: #d3d3d3;
      }
    }
  }
</style>
