declare module 'virtual:default-read-catalog' {
  const entries: Array<{
    id: string
    path: string
    filename: string
    revision: string
    coverPath?: string
  }>
  export default entries
}
