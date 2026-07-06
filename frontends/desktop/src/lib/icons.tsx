const GLYPH_MAP: Record<string, string> = {
  'robot': '',
  'symbol-misc': '',
  'comment': '',
  'files': '',
  'graph': '',
  'search': '',
  'add': '',
  'kebab-vertical': '',
  'grabber': '',
  'arrow-left': '',
  'chevron-right': '',
  'settings-gear': '',
  'link': '',
  'layout-sidebar-left': '',
  'layout-sidebar-left-off': '',
  'circle-filled': '',
  'pin': '\uEB2B',
  'pinned': '\uEBA0',
  'edit': '\uEA73',
  'trash': '\uEA81',
};

export function Codicon({
  name,
  size,
  className,
}: {
  name: string;
  size?: string;
  className?: string;
}) {
  const glyph = GLYPH_MAP[name];
  return (
    <span
      className={`codicon${className ? ' ' + className : ''}`}
      style={{ fontSize: size, display: 'inline-block', lineHeight: 1 }}
      aria-hidden="true"
    >
      {glyph ?? '?'}
    </span>
  );
}
