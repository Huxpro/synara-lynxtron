export function Spinner(props: { readonly className?: string; readonly color?: string; readonly size?: number }) {
  const size = props.size ?? 16;
  return <view accessibility-element accessibility-label="Loading" accessibility-trait="updating" className={`LxSpinner${props.className ? ` ${props.className}` : ''}`} style={{ width: `${size}px`, height: `${size}px`, borderColor: props.color }} />;
}
