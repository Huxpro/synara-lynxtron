export function scrollLynxElementIntoViewById(
  id: string,
  block: 'nearest' | 'start' = 'start'
): boolean {
  if (!id.trim()) return false;
  try {
    lynx
      .createSelectorQuery()
      .select(`#${id}`)
      .invoke({
        method: 'scrollIntoView',
        params: {
          scrollIntoViewOptions: {
            block,
            inline: 'start',
          },
        },
      })
      .exec();
    return true;
  } catch {
    return false;
  }
}
