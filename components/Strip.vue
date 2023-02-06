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
    viewBox="0 0 766 55"
    :class="{ strip: true, hover: props.hover, touch: props.touch }"
  >
    <mask
      id="a"
      width="766"
      height="55"
      x="0"
      y="0"
      fill="#000"
      maskUnits="userSpaceOnUse"
    >
      <path fill="#fff" d="M0 0h766v55H0z" />
      <path
        d="M1 5a5 5 0 0 1 5-5h754a5 5 0 0 1 5 5v41a5 5 0 0 1-5 5H6a5 5 0 0 1-5-5V5Z"
      />
    </mask>
    <path
      fill="#D3D3D3"
      d="M1 5a5 5 0 0 1 5-5h754a5 5 0 0 1 5 5v41a5 5 0 0 1-5 5H6a5 5 0 0 1-5-5V5Z"
    />
    <path
      fill="#AAA"
      d="M1 0h764H1Zm765 49a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6l2-3c0 .552 1.79 1 4 1h754c2.209 0 4-.448 4-1l2 3ZM6 55a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6C3.79 0 2 2.239 2 5v41c0 .552 1.79 1 4 1v8ZM760 0a6 6 0 0 1 6 6v43a6 6 0 0 1-6 6v-8c2.209 0 4-.448 4-1V5c0-2.761-1.791-5-4-5Z"
      mask="url(#a)"
    />
    <mask
      id="b"
      width="53"
      height="54"
      x="667"
      y="0"
      fill="#000"
      maskUnits="userSpaceOnUse"
    >
      <path fill="#fff" d="M667 0h53v54h-53z" />
      <path
        d="M668 5a5 5 0 0 1 5-5h41a5 5 0 0 1 5 5v41a5 5 0 0 1-5 5h-41a5 5 0 0 1-5-5V5Z"
      />
    </mask>
    <path
      fill="#668C51"
      d="M668 5a5 5 0 0 1 5-5h41a5 5 0 0 1 5 5v41a5 5 0 0 1-5 5h-41a5 5 0 0 1-5-5V5Z"
      class="test-color"
    />
    <path
      fill="#AAA"
      d="M668 0h51-51Zm52 48a6 6 0 0 1-6 6h-41a6 6 0 0 1-6-6l2-2c0 1.105 1.791 2 4 2h41c2.209 0 4-.895 4-2l2 2Zm-47 6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6c-2.209 0-4 2.239-4 5v41c0 1.105 1.791 2 4 2v6Zm41-54a6 6 0 0 1 6 6v42a6 6 0 0 1-6 6v-6c2.209 0 4-.895 4-2V5c0-2.761-1.791-5-4-5Z"
      mask="url(#b)"
    />
    <mask
      id="c"
      width="53"
      height="54"
      x="595"
      y="0"
      fill="#000"
      maskUnits="userSpaceOnUse"
    >
      <path fill="#fff" d="M595 0h53v54h-53z" />
      <path
        d="M596 5a5 5 0 0 1 5-5h41a5 5 0 0 1 5 5v41a5 5 0 0 1-5 5h-41a5 5 0 0 1-5-5V5Z"
      />
    </mask>
    <path
      fill="#D5C055"
      d="M596 5a5 5 0 0 1 5-5h41a5 5 0 0 1 5 5v41a5 5 0 0 1-5 5h-41a5 5 0 0 1-5-5V5Z"
      class="test-color"
    />
    <path
      fill="#AAA"
      d="M596 0h51-51Zm52 48a6 6 0 0 1-6 6h-41a6 6 0 0 1-6-6l2-2c0 1.105 1.791 2 4 2h41c2.209 0 4-.895 4-2l2 2Zm-47 6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6c-2.209 0-4 2.239-4 5v41c0 1.105 1.791 2 4 2v6Zm41-54a6 6 0 0 1 6 6v42a6 6 0 0 1-6 6v-6c2.209 0 4-.895 4-2V5c0-2.761-1.791-5-4-5Z"
      mask="url(#c)"
    />
    <mask
      id="d"
      width="53"
      height="54"
      x="523"
      y="0"
      fill="#000"
      maskUnits="userSpaceOnUse"
    >
      <path fill="#fff" d="M523 0h53v54h-53z" />
      <path
        d="M524 5a5 5 0 0 1 5-5h41a5 5 0 0 1 5 5v41a5 5 0 0 1-5 5h-41a5 5 0 0 1-5-5V5Z"
      />
    </mask>
    <path
      fill="#E962FF"
      d="M524 5a5 5 0 0 1 5-5h41a5 5 0 0 1 5 5v41a5 5 0 0 1-5 5h-41a5 5 0 0 1-5-5V5Z"
      class="test-positive"
    />
    <path
      fill="#AAA"
      d="M524 0h51-51Zm52 48a6 6 0 0 1-6 6h-41a6 6 0 0 1-6-6l2-2c0 1.105 1.791 2 4 2h41c2.209 0 4-.895 4-2l2 2Zm-47 6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6c-2.209 0-4 2.239-4 5v41c0 1.105 1.791 2 4 2v6Zm41-54a6 6 0 0 1 6 6v42a6 6 0 0 1-6 6v-6c2.209 0 4-.895 4-2V5c0-2.761-1.791-5-4-5Z"
      mask="url(#d)"
    />
    <mask
      id="e"
      width="53"
      height="54"
      x="451"
      y="0"
      fill="#000"
      maskUnits="userSpaceOnUse"
    >
      <path fill="#fff" d="M451 0h53v54h-53z" />
      <path
        d="M452 5a5 5 0 0 1 5-5h41a5 5 0 0 1 5 5v41a5 5 0 0 1-5 5h-41a5 5 0 0 1-5-5V5Z"
      />
    </mask>
    <path
      fill="#7C648B"
      d="M452 5a5 5 0 0 1 5-5h41a5 5 0 0 1 5 5v41a5 5 0 0 1-5 5h-41a5 5 0 0 1-5-5V5Z"
      class="test-color"
    />
    <path
      fill="#AAA"
      d="M452 0h51-51Zm52 48a6 6 0 0 1-6 6h-41a6 6 0 0 1-6-6l2-2c0 1.105 1.791 2 4 2h41c2.209 0 4-.895 4-2l2 2Zm-47 6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6c-2.209 0-4 2.239-4 5v41c0 1.105 1.791 2 4 2v6Zm41-54a6 6 0 0 1 6 6v42a6 6 0 0 1-6 6v-6c2.209 0 4-.895 4-2V5c0-2.761-1.791-5-4-5Z"
      mask="url(#e)"
    />
    <mask
      id="f"
      width="53"
      height="54"
      x="379"
      y="0"
      fill="#000"
      maskUnits="userSpaceOnUse"
    >
      <path fill="#fff" d="M379 0h53v54h-53z" />
      <path
        d="M380 5a5 5 0 0 1 5-5h41a5 5 0 0 1 5 5v41a5 5 0 0 1-5 5h-41a5 5 0 0 1-5-5V5Z"
      />
    </mask>
    <path
      fill="#DCBA81"
      d="M380 5a5 5 0 0 1 5-5h41a5 5 0 0 1 5 5v41a5 5 0 0 1-5 5h-41a5 5 0 0 1-5-5V5Z"
      class="test-color"
    />
    <path
      fill="#AAA"
      d="M380 0h51-51Zm52 48a6 6 0 0 1-6 6h-41a6 6 0 0 1-6-6l2-2c0 1.105 1.791 2 4 2h41c2.209 0 4-.895 4-2l2 2Zm-47 6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6c-2.209 0-4 2.239-4 5v41c0 1.105 1.791 2 4 2v6Zm41-54a6 6 0 0 1 6 6v42a6 6 0 0 1-6 6v-6c2.209 0 4-.895 4-2V5c0-2.761-1.791-5-4-5Z"
      mask="url(#f)"
    />
    <mask
      id="g"
      width="53"
      height="54"
      x="307"
      y="0"
      fill="#000"
      maskUnits="userSpaceOnUse"
    >
      <path fill="#fff" d="M307 0h53v54h-53z" />
      <path
        d="M308 5a5 5 0 0 1 5-5h41a5 5 0 0 1 5 5v41a5 5 0 0 1-5 5h-41a5 5 0 0 1-5-5V5Z"
      />
    </mask>
    <path
      fill="#D3C360"
      d="M308 5a5 5 0 0 1 5-5h41a5 5 0 0 1 5 5v41a5 5 0 0 1-5 5h-41a5 5 0 0 1-5-5V5Z"
      class="test-color"
    />
    <path
      fill="#AAA"
      d="M308 0h51-51Zm52 48a6 6 0 0 1-6 6h-41a6 6 0 0 1-6-6l2-2c0 1.105 1.791 2 4 2h41c2.209 0 4-.895 4-2l2 2Zm-47 6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6c-2.209 0-4 2.239-4 5v41c0 1.105 1.791 2 4 2v6Zm41-54a6 6 0 0 1 6 6v42a6 6 0 0 1-6 6v-6c2.209 0 4-.895 4-2V5c0-2.761-1.791-5-4-5Z"
      mask="url(#g)"
    />
    <mask
      id="h"
      width="53"
      height="54"
      x="235"
      y="0"
      fill="#000"
      maskUnits="userSpaceOnUse"
    >
      <path fill="#fff" d="M235 0h53v54h-53z" />
      <path
        d="M236 5a5 5 0 0 1 5-5h41a5 5 0 0 1 5 5v41a5 5 0 0 1-5 5h-41a5 5 0 0 1-5-5V5Z"
      />
    </mask>
    <path
      fill="#C29250"
      d="M236 5a5 5 0 0 1 5-5h41a5 5 0 0 1 5 5v41a5 5 0 0 1-5 5h-41a5 5 0 0 1-5-5V5Z"
      class="test-color"
    />
    <path
      fill="#AAA"
      d="M236 0h51-51Zm52 48a6 6 0 0 1-6 6h-41a6 6 0 0 1-6-6l2-2c0 1.105 1.791 2 4 2h41c2.209 0 4-.895 4-2l2 2Zm-47 6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6c-2.209 0-4 2.239-4 5v41c0 1.105 1.791 2 4 2v6Zm41-54a6 6 0 0 1 6 6v42a6 6 0 0 1-6 6v-6c2.209 0 4-.895 4-2V5c0-2.761-1.791-5-4-5Z"
      mask="url(#h)"
    />
  </svg>
</template>

<style lang="scss" scoped>
  @keyframes colorize {
    0% {
      fill: #fff;
    }
    100% {
      fill: #e962ff;
    }
  }

  @keyframes zoom-in {
    0% {
      transform: scale(1, 1) translateX(-22%);
    }
    100% {
      transform: scale(4, 4) translateX(-22%);
    }
  }

  .strip {
    &.hover {
      // height: 1em;
      animation-iteration-count: 1;
      animation-name: zoom-in;
      animation-duration: 1s;
      animation-fill-mode: forwards;

      .test-positive {
        animation-name: colorize;
        animation-duration: 3s;
        animation-play-state: running;
        animation-delay: 0s;
        animation-iteration-count: 1;
      }
    }
  }

  @media screen and (hover: none) {
    .strip:not(.touch) {
      .test-color,
      .test-positive {
        fill: #d3d3d3;
      }
    }
  }

  @media screen and (hover: hover) {
    .strip:not(.hover) {
      .test-color,
      .test-positive {
        fill: #d3d3d3;
      }
    }
  }
</style>
