// Shows a real web page inside Internet Explorer. Sites that forbid framing
// (Google, Bing, ...) will show the browser's own blocked-page message.
export default function WebFrame({ url, onLoad }: { url: string; onLoad?: () => void }) {
  return (
    <iframe
      src={url}
      title={url}
      onLoad={onLoad}
      style={{ border: 'none', width: '100%', height: '100%', background: '#fff' }}
      // Keep framed pages from navigating the whole simulator away.
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  );
}
