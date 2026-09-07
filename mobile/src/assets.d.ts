/* Import statique d'images (Metro les résout en identifiant d'asset). */
declare module '*.png' {
  const source: number
  export default source
}
