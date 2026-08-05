<template>
  <div
    ref="viewport"
    class="board-camera"
    :class="{'board-camera--panning': isPanning}"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @wheel.prevent="onWheel"
  >
    <div class="board-camera__world" :style="worldStyle">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {
  CameraState,
  CameraSize,
  DEFAULT_MAX_SCALE,
  DEFAULT_PADDING_PX,
  PAN_TAP_THRESHOLD_PX,
  distance,
  fitScale,
  initialCamera,
  midpoint,
  panBy,
  zoomAt,
} from '@/client/utils/boardCameraMath';

type PointerPt = {id: number, x: number, y: number};

export default defineComponent({
  name: 'BoardCamera',
  props: {
    contentWidth: {
      type: Number,
      required: true,
    },
    contentHeight: {
      type: Number,
      required: true,
    },
    maxScale: {
      type: Number,
      default: DEFAULT_MAX_SCALE,
    },
    paddingPx: {
      type: Number,
      default: DEFAULT_PADDING_PX,
    },
  },
  data() {
    return {
      camera: {x: 0, y: 0, scale: 1} as CameraState,
      viewportSize: {width: 360, height: 400} as CameraSize,
      pointers: [] as Array<PointerPt>,
      lastPinchDist: 0,
      panOrigin: null as null | {x: number, y: number, camX: number, camY: number},
      isPanning: false,
      movedPx: 0,
      resizeObserver: null as ResizeObserver | null,
    };
  },
  computed: {
    content(): CameraSize {
      return {width: this.contentWidth, height: this.contentHeight};
    },
    minScale(): number {
      return fitScale(this.viewportSize, this.content, this.paddingPx);
    },
    worldStyle(): Record<string, string> {
      const {x, y, scale} = this.camera;
      return {
        width: `${this.contentWidth}px`,
        height: `${this.contentHeight}px`,
        transform: `translate(${x}px, ${y}px) scale(${scale})`,
        transformOrigin: '0 0',
      };
    },
  },
  watch: {
    contentWidth() {
      this.resetCamera();
    },
    contentHeight() {
      this.resetCamera();
    },
  },
  methods: {
    resetCamera() {
      this.camera = initialCamera(this.viewportSize, this.content, this.paddingPx);
    },
    measureViewport() {
      const el = this.$refs.viewport as HTMLElement | undefined;
      if (el === undefined) {
        return;
      }
      const rect = el.getBoundingClientRect();
      this.viewportSize = {
        width: Math.max(1, rect.width),
        height: Math.max(1, rect.height),
      };
    },
    localPoint(event: PointerEvent): {x: number, y: number} {
      const el = this.$refs.viewport as HTMLElement;
      const rect = el.getBoundingClientRect();
      return {x: event.clientX - rect.left, y: event.clientY - rect.top};
    },
    onPointerDown(event: PointerEvent) {
      const el = this.$refs.viewport as HTMLElement;
      el.setPointerCapture(event.pointerId);
      const pt = {id: event.pointerId, ...this.localPoint(event)};
      this.pointers = this.pointers.filter((p) => p.id !== pt.id).concat([pt]);
      this.movedPx = 0;
      this.isPanning = false;

      if (this.pointers.length === 1) {
        this.panOrigin = {
          x: pt.x,
          y: pt.y,
          camX: this.camera.x,
          camY: this.camera.y,
        };
        this.lastPinchDist = 0;
      } else if (this.pointers.length >= 2) {
        this.panOrigin = null;
        this.lastPinchDist = distance(this.pointers[0], this.pointers[1]);
        this.isPanning = true;
      }
    },
    onPointerMove(event: PointerEvent) {
      const idx = this.pointers.findIndex((p) => p.id === event.pointerId);
      if (idx < 0) {
        return;
      }
      const pt = {id: event.pointerId, ...this.localPoint(event)};
      this.pointers.splice(idx, 1, pt);

      if (this.pointers.length >= 2) {
        const a = this.pointers[0];
        const b = this.pointers[1];
        const dist = distance(a, b);
        if (this.lastPinchDist > 0) {
          const pivot = midpoint(a, b);
          const factor = dist / this.lastPinchDist;
          this.camera = zoomAt(
            this.camera,
            this.viewportSize,
            this.content,
            this.camera.scale * factor,
            pivot.x,
            pivot.y,
            this.minScale,
            this.maxScale,
            this.paddingPx,
          );
        }
        this.lastPinchDist = dist;
        this.isPanning = true;
        return;
      }

      if (this.panOrigin !== null && this.pointers.length === 1) {
        const dx = pt.x - this.panOrigin.x;
        const dy = pt.y - this.panOrigin.y;
        this.movedPx = Math.max(this.movedPx, Math.hypot(dx, dy));
        if (this.movedPx > PAN_TAP_THRESHOLD_PX) {
          this.isPanning = true;
        }
        this.camera = panBy(
          {scale: this.camera.scale, x: this.panOrigin.camX, y: this.panOrigin.camY},
          this.viewportSize,
          this.content,
          dx,
          dy,
          this.paddingPx,
        );
      }
    },
    onPointerUp(event: PointerEvent) {
      const el = this.$refs.viewport as HTMLElement;
      try {
        el.releasePointerCapture(event.pointerId);
      } catch (_e) {
        // already released
      }
      this.pointers = this.pointers.filter((p) => p.id !== event.pointerId);
      if (this.pointers.length === 0) {
        this.panOrigin = null;
        this.lastPinchDist = 0;
        // Keep isPanning true briefly so click handlers on children can check,
        // then clear on next tick.
        if (this.isPanning && this.movedPx > PAN_TAP_THRESHOLD_PX) {
          this.$nextTick(() => {
            this.isPanning = false;
            this.movedPx = 0;
          });
        } else {
          this.isPanning = false;
          this.movedPx = 0;
        }
      } else if (this.pointers.length === 1) {
        const p = this.pointers[0];
        this.panOrigin = {
          x: p.x,
          y: p.y,
          camX: this.camera.x,
          camY: this.camera.y,
        };
        this.lastPinchDist = 0;
      }
    },
    onWheel(event: WheelEvent) {
      const pt = (() => {
        const el = this.$refs.viewport as HTMLElement;
        const rect = el.getBoundingClientRect();
        return {x: event.clientX - rect.left, y: event.clientY - rect.top};
      })();
      const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1;
      this.camera = zoomAt(
        this.camera,
        this.viewportSize,
        this.content,
        this.camera.scale * factor,
        pt.x,
        pt.y,
        this.minScale,
        this.maxScale,
        this.paddingPx,
      );
    },
  },
  mounted() {
    this.measureViewport();
    this.resetCamera();
    const el = this.$refs.viewport as HTMLElement;
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        const prevMin = this.minScale;
        this.measureViewport();
        // Re-clamp; if fit scale changed, nudge toward a usable view.
        if (this.camera.scale < this.minScale || Math.abs(prevMin - this.minScale) > 0.001) {
          this.camera = zoomAt(
            this.camera,
            this.viewportSize,
            this.content,
            Math.max(this.camera.scale, this.minScale),
            this.viewportSize.width / 2,
            this.viewportSize.height / 2,
            this.minScale,
            this.maxScale,
            this.paddingPx,
          );
        } else {
          this.camera = panBy(this.camera, this.viewportSize, this.content, 0, 0, this.paddingPx);
        }
      });
      this.resizeObserver.observe(el);
    }
    window.addEventListener('resize', this.measureViewport);
  },
  beforeUnmount() {
    this.resizeObserver?.disconnect();
    window.removeEventListener('resize', this.measureViewport);
  },
});
</script>
