// ─────────────────────────────────────────────────────────────
// components/template/EditorToolbar.tsx
// Enhanced Email Composer Toolbar
// - Removed: Image, CodeBlock, Subscript, Superscript, Highlight
// - Working: BulletList, OrderedList, Color, TextAlign
// - Added: Layout Blocks (Section, 2-col, 3-col, Spacer, Button, Divider, Hero, Footer)
// ─────────────────────────────────────────────────────────────
import { Editor } from '@tiptap/react';
import React, { useCallback, useRef, useState } from 'react';
import styles from './emailEditor.module.scss';
import { makeButton, makeDivider, makeFooter, makeHero, makeSection, makeSpacer, makeThreeColumns, makeTwoColumns } from '@/utils/emailTransformer';


interface Props {
  editor: Editor | null;
}

/* ── Modal ── */
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.modalOverlay} onMouseDown={onClose}>
      <div
        className={styles.modal}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>{title}</span>
          <button className={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Divider() {
  return <span className={styles.toolbarDivider} aria-hidden />;
}

function GroupLabel({ label }: { label: string }) {
  return <span className={styles.groupLabel}>{label}</span>;
}

// ── Preset colors ─────────────────────────────────────────────
const PRESET_COLORS = [
  '#000000', '#374151', '#6B7280', '#9CA3AF', '#ffffff',
  '#DC2626', '#D97706', '#16A34A', '#2563EB', '#7C3AED',
  '#DB2777', '#0891B2', '#EA580C', '#65A30D', '#0284C7',
];

export default function EditorToolbar({ editor }: Props) {
  // ── modal states ───────────────────────────────────────────
  const [linkModal, setLinkModal] = useState(false);
  const [buttonModal, setButtonModal] = useState(false);
  const [tableModal, setTableModal] = useState(false);
  const [heroModal, setHeroModal] = useState(false);
  const [footerModal, setFooterModal] = useState(false);
  const [colorPicker, setColorPicker] = useState(false);
  const [fontSizeOpen, setFontSizeOpen] = useState(false);
  const [alignOpen, setAlignOpen] = useState(false);
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [spacerOpen, setSpacerOpen] = useState(false);

  // ── form fields ────────────────────────────────────────────
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [btnText, setBtnText] = useState('Click Here');
  const [btnUrl, setBtnUrl] = useState('https://');
  const [btnColor, setBtnColor] = useState('#2563eb');
  const [btnTextColor, setBtnTextColor] = useState('#ffffff');
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [heroTitle, setHeroTitle] = useState('Welcome!');
  const [heroSub, setHeroSub] = useState('Your message here');
  const [heroCta, setHeroCta] = useState('Get Started');
  const [heroCtaUrl, setHeroCtaUrl] = useState('https://');
  const [heroBg, setHeroBg] = useState('#1e293b');
  const [footerLines, setFooterLines] = useState('Company Name\nUnsubscribe | Privacy Policy');
  const [selectedColor, setSelectedColor] = useState('#000000');

  if (!editor) return null;

  const isActive = (name: string, attrs?: object) =>
    attrs ? editor.isActive(name, attrs) : editor.isActive(name);

  const can = (cmd: string) => (editor.can() as any)[cmd]?.();

  const closeAll = () => {
    setColorPicker(false);
    setFontSizeOpen(false);
    setAlignOpen(false);
    setLayoutOpen(false);
    setSpacerOpen(false);
  };

  // ── Link ───────────────────────────────────────────────────
  const openLinkModal = () => {
    const prev = editor.getAttributes('link').href ?? '';
    const sel = editor.state.doc.cut(editor.state.selection.from, editor.state.selection.to).textContent;
    setLinkUrl(prev);
    setLinkText(sel || '');
    setLinkModal(true);
  };

  const applyLink = () => {
    if (!linkUrl) return;
    if (linkText && editor.state.selection.empty) {
      editor.chain().focus().insertContent(`<a href="${linkUrl}" target="_blank">${linkText}</a>`).run();
    } else {
      editor.chain().focus().setLink({ href: linkUrl, target: '_blank' }).run();
    }
    setLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
    setLinkModal(false);
  };

  // ── Button / CTA ───────────────────────────────────────────
  const applyButton = () => {
    if (!btnText || !btnUrl) return;
    const html = makeButton(btnText, btnUrl, btnColor, btnTextColor);
    editor.chain().focus().insertContent(html).run();
    setButtonModal(false);
    setBtnText('Click Here');
    setBtnUrl('https://');
  };

  // ── Table ──────────────────────────────────────────────────
  const applyTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true })
      .run();
    setTableModal(false);
  };

  // ── Color ──────────────────────────────────────────────────
  const applyColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
    setSelectedColor(color);
    setColorPicker(false);
  };

  // ── Font size ──────────────────────────────────────────────
  const FONT_SIZES = ['10', '12', '14', '16', '18', '20', '24', '28', '32', '36'];
  const applyFontSize = (size: string) => {
    editor.chain().focus().setMark('textStyle', { fontSize: `${size}px` }).run();
    setFontSizeOpen(false);
  };

  // ── Alignment ─────────────────────────────────────────────
  const ALIGNS: { label: string; value: 'left' | 'center' | 'right' | 'justify'; icon: string }[] = [
    { label: 'Left', value: 'left', icon: '⬛▬▬' },
    { label: 'Center', value: 'center', icon: '▬⬛▬' },
    { label: 'Right', value: 'right', icon: '▬▬⬛' },
    { label: 'Justify', value: 'justify', icon: '▬▬▬' },
  ];

  // ── Layout blocks ─────────────────────────────────────────
  const insertSection = () => {
    editor.chain().focus().insertContent(makeSection('<p>Section content…</p>')).run();
    setLayoutOpen(false);
  };

  const insertTwoCol = () => {
    editor.chain().focus().insertContent(makeTwoColumns('<p>Left column</p>', '<p>Right column</p>')).run();
    setLayoutOpen(false);
  };

  const insertThreeCol = () => {
    editor.chain().focus().insertContent(makeThreeColumns(['<p>Col 1</p>', '<p>Col 2</p>', '<p>Col 3</p>'])).run();
    setLayoutOpen(false);
  };

  const insertSpacer = (h: number) => {
    editor.chain().focus().insertContent(makeSpacer(h)).run();
    setSpacerOpen(false);
    closeAll();
  };

  const insertDividerBlock = () => {
    editor.chain().focus().insertContent(makeDivider()).run();
  };

  const applyHero = () => {
    editor
      .chain()
      .focus()
      .insertContent(makeHero(heroTitle, heroSub, heroCta, heroCtaUrl, heroBg))
      .run();
    setHeroModal(false);
  };

  const applyFooter = () => {
    editor
      .chain()
      .focus()
      .insertContent(makeFooter(footerLines.split('\n').filter(Boolean)))
      .run();
    setFooterModal(false);
  };

  // ── Indent ─────────────────────────────────────────────────
  const indent = () => editor.chain().focus().sinkListItem('listItem').run();
  const outdent = () => editor.chain().focus().liftListItem('listItem').run();

  // ── Signature ─────────────────────────────────────────────
  const insertSignature = () => {
    editor
      .chain()
      .focus()
      .insertContent(
        `<p>—</p><p><strong>Your Name</strong><br>Your Title | Your Company<br>email@example.com</p>`,
      )
      .run();
  };

  return (
    <>
      <div className={styles.toolbar}>
        {/* ── ROW 1: Format ── */}
        <div className={styles.toolbarRow}>
          <GroupLabel label="Format" />

          {([1, 2, 3] as const).map((lvl) => (
            <button
              key={lvl}
              title={`Heading ${lvl}`}
              onClick={() => editor.chain().focus().toggleHeading({ level: lvl }).run()}
              className={`${styles.toolbarBtn} ${styles.toolbarBtnWide} ${isActive('heading', { level: lvl }) ? styles.active : ''}`}
            >
              H{lvl}
            </button>
          ))}

          <Divider />

          {[
            { label: <strong>B</strong>, title: 'Bold', action: () => editor.chain().focus().toggleBold().run(), name: 'bold' },
            { label: <em>I</em>, title: 'Italic', action: () => editor.chain().focus().toggleItalic().run(), name: 'italic' },
            { label: <u>U</u>, title: 'Underline', action: () => editor.chain().focus().toggleUnderline().run(), name: 'underline' },
            { label: <s>S</s>, title: 'Strikethrough', action: () => editor.chain().focus().toggleStrike().run(), name: 'strike' },
          ].map((btn, i) => (
            <button
              key={i}
              title={btn.title}
              onClick={btn.action}
              className={`${styles.toolbarBtn} ${isActive(btn.name) ? styles.active : ''}`}
            >
              {btn.label}
            </button>
          ))}

          <Divider />

          {/* Font size */}
          <div className={styles.dropdownWrapper}>
            <button
              title="Font Size"
              className={`${styles.toolbarBtn} ${styles.toolbarBtnWide}`}
              onClick={() => { setFontSizeOpen((o) => !o); closeAll(); }}
            >
              Aa ▾
            </button>
            {fontSizeOpen && (
              <div className={styles.dropdown}>
                {FONT_SIZES.map((sz) => (
                  <button key={sz} className={styles.dropdownItem} onClick={() => applyFontSize(sz)}>
                    <span style={{ fontSize: `${Math.min(Number(sz), 20)}px` }}>{sz}px</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Text color */}
          <div className={styles.dropdownWrapper}>
            <button
              title="Text Color"
              className={`${styles.toolbarBtn} ${styles.colorBtn}`}
              onClick={() => { setColorPicker((o) => !o); closeAll(); setColorPicker(true); }}
            >
              <span className={styles.colorBtnLetter} style={{ borderBottom: `3px solid ${selectedColor}` }}>A</span>
            </button>
            {colorPicker && (
              <div className={styles.colorPalette}>
                <div className={styles.colorGrid}>
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      className={styles.colorSwatch}
                      style={{ background: c, border: c === '#ffffff' ? '1px solid #e2e8f0' : 'none' }}
                      title={c}
                      onClick={() => applyColor(c)}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  className={styles.colorCustom}
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  onBlur={(e) => applyColor(e.target.value)}
                  title="Custom color"
                />
              </div>
            )}
          </div>

          <Divider />

          {/* Alignment */}
          <div className={styles.dropdownWrapper}>
            <button
              title="Alignment"
              className={`${styles.toolbarBtn} ${styles.toolbarBtnWide}`}
              onClick={() => { setAlignOpen((o) => !o); closeAll(); setAlignOpen(true); }}
            >
              ≡▾
            </button>
            {alignOpen && (
              <div className={styles.dropdown}>
                {ALIGNS.map((a) => (
                  <button
                    key={a.value}
                    className={`${styles.dropdownItem} ${isActive({ textAlign: a.value } as any) ? styles.activeItem : ''}`}
                    onClick={() => { editor.chain().focus().setTextAlign(a.value).run(); setAlignOpen(false); }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Divider />

          <button title="Clear Formatting" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} className={styles.toolbarBtn}>
            T✕
          </button>
        </div>

        {/* ── ROW 2: Insert ── */}
        <div className={styles.toolbarRow}>
          <GroupLabel label="Insert" />

          {/* Lists */}
          <button
            title="Bullet List"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`${styles.toolbarBtn} ${isActive('bulletList') ? styles.active : ''}`}
          >
            •≡
          </button>
          <button
            title="Ordered List"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`${styles.toolbarBtn} ${isActive('orderedList') ? styles.active : ''}`}
          >
            1.≡
          </button>
          <button title="Indent" onClick={indent} className={styles.toolbarBtn} disabled={!isActive('listItem')}>→|</button>
          <button title="Outdent" onClick={outdent} className={styles.toolbarBtn} disabled={!isActive('listItem')}>|←</button>

          <Divider />

          <button title="Blockquote" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`${styles.toolbarBtn} ${isActive('blockquote') ? styles.active : ''}`}>❝</button>
          <button title="Horizontal Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={styles.toolbarBtn}>─</button>

          <Divider />

          <button title="Link" onClick={openLinkModal} className={`${styles.toolbarBtn} ${styles.toolbarBtnWide} ${isActive('link') ? styles.active : ''}`}>🔗 Link</button>
          <button title="CTA Button" className={`${styles.toolbarBtn} ${styles.toolbarBtnWide}`} onClick={() => setButtonModal(true)}>🔲 Button</button>
          <button title="Signature" className={`${styles.toolbarBtn} ${styles.toolbarBtnWide}`} onClick={insertSignature}>✍ Sig</button>

          <Divider />

          {/* Undo / Redo */}
          <button title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!can('undo')} className={styles.toolbarBtn}>↩</button>
          <button title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!can('redo')} className={styles.toolbarBtn}>↪</button>
        </div>

        {/* ── ROW 3: Layout Blocks ── */}
        <div className={styles.toolbarRow}>
          <GroupLabel label="Layout" />

          {/* Layout dropdown */}
          <div className={styles.dropdownWrapper}>
            <button
              title="Columns"
              className={`${styles.toolbarBtn} ${styles.toolbarBtnWide}`}
              onClick={() => { setLayoutOpen((o) => !o); closeAll(); setLayoutOpen(true); }}
            >
              ⊞ Cols ▾
            </button>
            {layoutOpen && (
              <div className={styles.dropdown} style={{ minWidth: 140 }}>
                <button className={styles.dropdownItem} onClick={insertSection}>□ Section</button>
                <button className={styles.dropdownItem} onClick={insertTwoCol}>▥ 2 Columns</button>
                <button className={styles.dropdownItem} onClick={insertThreeCol}>▦ 3 Columns</button>
              </div>
            )}
          </div>

          {/* Spacer */}
          <div className={styles.dropdownWrapper}>
            <button
              title="Spacer"
              className={`${styles.toolbarBtn} ${styles.toolbarBtnWide}`}
              onClick={() => { setSpacerOpen((o) => !o); closeAll(); setSpacerOpen(true); }}
            >
              ↕ Spacer ▾
            </button>
            {spacerOpen && (
              <div className={styles.dropdown} style={{ minWidth: 120 }}>
                {[8, 16, 24, 32, 48, 64].map((h) => (
                  <button key={h} className={styles.dropdownItem} onClick={() => insertSpacer(h)}>{h}px</button>
                ))}
              </div>
            )}
          </div>

          {/* Divider block */}
          <button title="Divider Block" className={`${styles.toolbarBtn} ${styles.toolbarBtnWide}`} onClick={insertDividerBlock}>― Divider</button>

          {/* Hero */}
          <button title="Hero Block" className={`${styles.toolbarBtn} ${styles.toolbarBtnWide}`} onClick={() => setHeroModal(true)}>🦸 Hero</button>

          {/* Footer */}
          <button title="Footer Block" className={`${styles.toolbarBtn} ${styles.toolbarBtnWide}`} onClick={() => setFooterModal(true)}>⚑ Footer</button>

          {/* Table */}
          <button title="Insert Table" className={`${styles.toolbarBtn} ${styles.toolbarBtnWide}`} onClick={() => setTableModal(true)}>⊞ Table</button>
        </div>

        {/* ── Table controls ── */}
        {isActive('table') && (
          <div className={`${styles.toolbarRow} ${styles.tableControls}`}>
            <GroupLabel label="Table" />
            <button className={`${styles.toolbarBtn} ${styles.toolbarBtnWide}`} onClick={() => editor.chain().focus().addColumnBefore().run()}>+Col←</button>
            <button className={`${styles.toolbarBtn} ${styles.toolbarBtnWide}`} onClick={() => editor.chain().focus().addColumnAfter().run()}>+Col→</button>
            <button className={`${styles.toolbarBtn} ${styles.toolbarBtnWide}`} onClick={() => editor.chain().focus().deleteColumn().run()}>−Col</button>
            <Divider />
            <button className={`${styles.toolbarBtn} ${styles.toolbarBtnWide}`} onClick={() => editor.chain().focus().addRowBefore().run()}>+Row↑</button>
            <button className={`${styles.toolbarBtn} ${styles.toolbarBtnWide}`} onClick={() => editor.chain().focus().addRowAfter().run()}>+Row↓</button>
            <button className={`${styles.toolbarBtn} ${styles.toolbarBtnWide}`} onClick={() => editor.chain().focus().deleteRow().run()}>−Row</button>
            <Divider />
            <button className={`${styles.toolbarBtn} ${styles.toolbarBtnWide}`} onClick={() => editor.chain().focus().mergeCells().run()}>⊞ Merge</button>
            <button className={`${styles.toolbarBtn} ${styles.toolbarBtnWide}`} onClick={() => editor.chain().focus().splitCell().run()}>⊟ Split</button>
            <Divider />
            <button className={`${styles.toolbarBtn} ${styles.toolbarBtnWide} ${styles.danger}`} onClick={() => editor.chain().focus().deleteTable().run()}>🗑 Del</button>
          </div>
        )}
      </div>

      {/* ── LINK MODAL ── */}
      {linkModal && (
        <Modal title="Insert / Edit Link" onClose={() => setLinkModal(false)}>
          <div className={styles.modalBody}>
            <label className={styles.modalLabel}>Link text (optional)</label>
            <input className={styles.modalInput} value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="Click here" />
            <label className={styles.modalLabel}>URL *</label>
            <input className={styles.modalInput} value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://" onKeyDown={(e) => e.key === 'Enter' && applyLink()} autoFocus />
            <div className={styles.modalFooter}>
              {isActive('link') && (
                <button className={`${styles.modalBtn} ${styles.danger}`} onClick={removeLink}>Remove</button>
              )}
              <button className={`${styles.modalBtn} ${styles.primary}`} onClick={applyLink} disabled={!linkUrl}>Apply</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── BUTTON MODAL ── */}
      {buttonModal && (
        <Modal title="Insert CTA Button" onClose={() => setButtonModal(false)}>
          <div className={styles.modalBody}>
            <label className={styles.modalLabel}>Button Text *</label>
            <input className={styles.modalInput} value={btnText} onChange={(e) => setBtnText(e.target.value)} placeholder="Click Here" autoFocus />
            <label className={styles.modalLabel}>URL *</label>
            <input className={styles.modalInput} value={btnUrl} onChange={(e) => setBtnUrl(e.target.value)} placeholder="https://" />
            <label className={styles.modalLabel}>Background Color</label>
            <div className={styles.colorRow}>
              <input type="color" value={btnColor} onChange={(e) => setBtnColor(e.target.value)} style={{ width: 40, height: 32, cursor: 'pointer', borderRadius: 4 }} />
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{btnColor}</span>
            </div>
            <label className={styles.modalLabel}>Text Color</label>
            <div className={styles.colorRow}>
              <input type="color" value={btnTextColor} onChange={(e) => setBtnTextColor(e.target.value)} style={{ width: 40, height: 32, cursor: 'pointer', borderRadius: 4 }} />
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{btnTextColor}</span>
            </div>
            {btnText && (
              <div className={styles.btnPreview}>
                <a href="#" style={{ display: 'inline-block', padding: '12px 28px', background: btnColor, color: btnTextColor, textDecoration: 'none', borderRadius: 6, fontWeight: 600, fontSize: 14 }}>
                  {btnText}
                </a>
              </div>
            )}
            <div className={styles.modalFooter}>
              <button className={`${styles.modalBtn} ${styles.primary}`} onClick={applyButton} disabled={!btnText || !btnUrl}>Insert</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── TABLE MODAL ── */}
      {tableModal && (
        <Modal title="Insert Table" onClose={() => setTableModal(false)}>
          <div className={styles.modalBody}>
            <label className={styles.modalLabel}>Rows</label>
            <input type="number" min={1} max={20} className={styles.modalInput} value={tableRows} onChange={(e) => setTableRows(Number(e.target.value))} />
            <label className={styles.modalLabel}>Columns</label>
            <input type="number" min={1} max={10} className={styles.modalInput} value={tableCols} onChange={(e) => setTableCols(Number(e.target.value))} />
            <div className={styles.modalFooter}>
              <button className={`${styles.modalBtn} ${styles.primary}`} onClick={applyTable}>Insert</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── HERO MODAL ── */}
      {heroModal && (
        <Modal title="Hero Block" onClose={() => setHeroModal(false)}>
          <div className={styles.modalBody}>
            <label className={styles.modalLabel}>Title</label>
            <input className={styles.modalInput} value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} />
            <label className={styles.modalLabel}>Subtitle</label>
            <input className={styles.modalInput} value={heroSub} onChange={(e) => setHeroSub(e.target.value)} />
            <label className={styles.modalLabel}>CTA Text</label>
            <input className={styles.modalInput} value={heroCta} onChange={(e) => setHeroCta(e.target.value)} />
            <label className={styles.modalLabel}>CTA URL</label>
            <input className={styles.modalInput} value={heroCtaUrl} onChange={(e) => setHeroCtaUrl(e.target.value)} />
            <label className={styles.modalLabel}>Background Color</label>
            <div className={styles.colorRow}>
              <input type="color" value={heroBg} onChange={(e) => setHeroBg(e.target.value)} style={{ width: 40, height: 32, cursor: 'pointer', borderRadius: 4 }} />
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{heroBg}</span>
            </div>
            <div className={styles.modalFooter}>
              <button className={`${styles.modalBtn} ${styles.primary}`} onClick={applyHero}>Insert</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── FOOTER MODAL ── */}
      {footerModal && (
        <Modal title="Footer Block" onClose={() => setFooterModal(false)}>
          <div className={styles.modalBody}>
            <label className={styles.modalLabel}>Footer lines (one per line)</label>
            <textarea
              className={styles.modalInput}
              value={footerLines}
              onChange={(e) => setFooterLines(e.target.value)}
              rows={4}
              style={{ resize: 'vertical' }}
            />
            <div className={styles.modalFooter}>
              <button className={`${styles.modalBtn} ${styles.primary}`} onClick={applyFooter}>Insert</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}