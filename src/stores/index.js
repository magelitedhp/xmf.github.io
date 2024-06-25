
import { defineStore } from 'pinia'
 
export const useStore = defineStore('count', {
  state: () => ({
    count: 0 || localStorage.getItem("count") * 1,
  }),
  getters: {
    doubleCount: (state) => state.count * 2,
  },
  actions: {
    increment(state) {
      this.count += state * 1
      localStorage.setItem("count", this.count)
    },
    minus(state) {
      this.count -= state * 1
      localStorage.setItem("count", this.count)
    },
    clear() {
      this.count = 0
      localStorage.setItem("count", this.count)
    },
  },
})