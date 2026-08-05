export function scrollLynxElementIntoViewById(id: string): boolean {
  if (!id.trim()) return false;
  try {
    lynx
      .createSelectorQuery()
      .select(`#${id}`)
      .invoke({
        method: 'scrollIntoView',
        params: {
          scrollIntoViewOptions: {
            block: 'start',
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
