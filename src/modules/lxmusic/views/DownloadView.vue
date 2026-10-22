<template>
  <div class="lx-page">
    <div class="lx-page-head">
      <h1 class="lx-page-title">下载</h1>
      <span class="lx-page-sub">
        等待 {{ waitingCount }} · 下载中 {{ runningCount }} · 完成 {{ completedCount }} · 失败 {{ errorCount }}
      </span>
      <button type="button" class="lx-btn" :disabled="!completedCount && !errorCount" @click="clearCompleted()">清除已完成</button>
      <button type="button" class="lx-btn" :disabled="!tasks.length" @click="clearAll()">清空全部</button>
    </div>

    <p v-if="!tasks.length" class="lx-empty">
      <strong>还没有下载任务</strong>
      <span>在任意列表里点下载，任务会出现在这里。</span>
    </p>

    <div v-for="task in tasks" :key="task.id" class="lx-download-row">
      <div class="lx-download-name">
        <LxCover :src="task.music.pic" :alt="`${task.music.name} 封面`" />
        <div class="lx-ellipsis">
          <strong class="lx-ellipsis">{{ task.music.name }}</strong>
          <small class="lx-ellipsis">{{ task.music.singer }}</small>
        </div>
      </div>

      <span class="lx-download-state" :class="stateClass(task.status)">{{ statusLabel(task.status) }}</span>

      <div class="lx-col-dl-progress">
        <div class="lx-progress-mini"><i :style="{ width: `${task.progress}%` }" /></div>
        <small class="lx-download-detail">{{ detailOf(task) }}</small>
      </div>

      <div class="lx-download-actions lx-col-dl-actions">
        <button
          v-if="task.status === 'running'"
          type="button"
          class="lx-icon-btn"
          aria-label="暂停"
          title="暂停"
          @click="pauseTask(task.id)"
        >
          <LxIcon name="pause" />
        </button>
        <button
          v-else-if="task.status === 'paused' || task.status === 'error'"
          type="button"
          class="lx-icon-btn"
          aria-label="继续"
          title="继续"
          @click="resumeTask(task.id)"
        >
          <LxIcon name="play" />
        </button>
        <button type="button" class="lx-icon-btn" aria-label="移除" title="移除" @click="removeTask(task.id)">
          <LxIcon name="trash" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LxIcon from '../components/LxIcon.vue'
import LxCover from '../components/LxCover.vue'
import {
  clearAll,
  clearCompleted,
  completedCount,
  errorCount,
  pauseTask,
  removeTask,
  resumeTask,
  runningCount,
  tasks,
  waitingCount,
  type DownloadStatus,
  type DownloadTask,
} from '../core/download'

function statusLabel(status: DownloadStatus): string {
  return { waiting: '等待中', running: '下载中', paused: '已暂停', error: '失败', completed: '已完成' }[status]
}

function stateClass(status: DownloadStatus): string {
  return status === 'error' ? 'is-error' : status === 'completed' ? 'is-completed' : ''
}

function formatSize(bytes: number): string {
  if (!bytes) return '—'
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / 1048576).toFixed(1)}MB`
}

function detailOf(task: DownloadTask): string {
  if (task.status === 'completed') return task.fileName
  if (task.status === 'running' && task.speed) return `${formatSize(task.received)} / ${formatSize(task.total)} · ${formatSize(task.speed)}/s`
  return task.message
}
</script>

<style>
.lx-download-name strong {
  display: block;
  font-weight: 500;
  color: var(--lx-font);
}

.lx-download-name small {
  display: block;
  color: var(--lx-font-muted);
  font-size: 12px;
}

.lx-download-detail {
  display: block;
  margin-top: 4px;
  color: var(--lx-font-muted);
  font-size: 12px;
}
</style>
