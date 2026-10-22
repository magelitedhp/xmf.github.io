import { reactive } from 'vue'

export interface CollectionMorphPlan {
  itemId: string
  coverUrl: string
  title: string
  rect: {
    x: number
    y: number
    width: number
    height: number
  }
  radius: number
  shade: string
}

export interface CollectionMorphEnd {
  rect: {
    x: number
    y: number
    width: number
    height: number
  }
  radius: number
  shade?: string
}

export interface CollectionMorphState {
  /** The page that is opening reads this in its first render. */
  plan: CollectionMorphPlan | null
  /** The tile the next wall should expand after returning from its collection. */
  returnItemId: string
  /** The item whose page is leaving, and the page card its return flight starts from. */
  exitItemId: string
  exitCoverUrl: string
  /** The detail page's hero, measured before its route is left. */
  exitFrom: CollectionMorphEnd | null
}

const PLAN_TTL_MS = 2400

export const collectionMorph = reactive<CollectionMorphState>({
  plan: null,
  returnItemId: '',
  exitItemId: '',
  exitCoverUrl: '',
  exitFrom: null,
})

let planTimer = 0

export function planCollectionFromWall(plan: CollectionMorphPlan): void {
  window.clearTimeout(planTimer)
  collectionMorph.plan = { ...plan }
  collectionMorph.returnItemId = plan.itemId
  collectionMorph.exitItemId = ''
  collectionMorph.exitCoverUrl = ''
  collectionMorph.exitFrom = null
  planTimer = window.setTimeout(() => {
    planTimer = 0
    if (collectionMorph.plan?.itemId === plan.itemId) {
      collectionMorph.plan = null
    }
  }, PLAN_TTL_MS)
}

export function consumeCollectionPlan(): CollectionMorphPlan | null {
  const plan = collectionMorph.plan
  if (!plan) return null
  window.clearTimeout(planTimer)
  planTimer = 0
  collectionMorph.plan = null
  return plan
}

export function armCollectionReturn(
  itemId: string,
  coverUrl: string,
  from?: CollectionMorphEnd,
): void {
  collectionMorph.returnItemId = itemId
  collectionMorph.exitItemId = itemId
  collectionMorph.exitCoverUrl = coverUrl
  if (from) collectionMorph.exitFrom = from
}

export function finishCollectionReturn(): void {
  collectionMorph.returnItemId = ''
  collectionMorph.exitItemId = ''
  collectionMorph.exitCoverUrl = ''
  collectionMorph.exitFrom = null
}
