<template>
  <Transition name="lx-modal">
    <div v-if="open" class="lx-modal-mask" @click.self="emit('close')">
      <div class="lx-modal" :class="{ 'is-wide': wide }" role="dialog" aria-modal="true">
        <header class="lx-modal-head">
          <h3>{{ title }}</h3>
          <button type="button" class="lx-icon-btn" aria-label="关闭" @click="emit('close')">
            <LxIcon name="close" />
          </button>
        </header>
        <div class="lx-modal-body">
          <slot />
        </div>
        <footer v-if="$slots.footer" class="lx-modal-foot">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import LxIcon from './LxIcon.vue'

withDefaults(
  defineProps<{
    open: boolean
    title: string
    wide?: boolean
  }>(),
  { wide: false },
)

const emit = defineEmits<{ close: [] }>()
</script>

<style>
/* src/components/shared/overlayEntranceMotion.ts */
.lx-modal-enter-active,
.lx-modal-leave-active {
  transition: opacity 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.lx-modal-enter-active .lx-modal,
.lx-modal-leave-active .lx-modal {
  transition:
    opacity 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.lx-modal-enter-from,
.lx-modal-leave-to {
  opacity: 0;
}

.lx-modal-enter-from .lx-modal,
.lx-modal-leave-to .lx-modal {
  opacity: 0;
  transform: translateY(18px) scale(0.985);
}

.lx-modal-leave-from .lx-modal {
  transform: translateY(0) scale(1);
}

.lx-modal-leave-to .lx-modal {
  transform: translateY(12px) scale(0.99);
}

@media (prefers-reduced-motion: reduce) {
  .lx-modal-enter-active,
  .lx-modal-leave-active,
  .lx-modal-enter-active .lx-modal,
  .lx-modal-leave-active .lx-modal {
    transition-duration: 0.12s;
    transition-timing-function: linear;
  }

  .lx-modal-enter-from .lx-modal,
  .lx-modal-leave-to .lx-modal {
    transform: none;
  }
}
</style>
