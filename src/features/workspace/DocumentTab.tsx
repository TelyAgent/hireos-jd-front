import { useEffect, useRef, useState } from "react";
import { Icon } from "../../components/ui/Icons";
import { useStore } from "../../store/StoreContext";
import { selectDraft, selectSuggestions, selectThreads, pendingSuggestionsFor } from "./docHelpers";
import { SidePanel } from "./SidePanel";
import { useDocActions } from "./docActions";
import type { Audience, DocBlock } from "../../data/types";
import type { WsMode } from "../../store/types";

const MODES: WsMode[] = ["editing", "suggesting", "viewing"];

export function scrollToBlock(blockId: string) {
  const el = document.querySelector(`.doc-block[data-block-id="${blockId}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.add("selected");
  setTimeout(() => el.classList.remove("selected"), 1200);
}

interface PendingSel {
  text: string;
  blockId: string | null;
  top: number;
  left: number;
}

export function DocumentTab({ jobId, audience }: { jobId: string; audience: Audience }) {
  const { state, t, set, say } = useStore();
  const draft = selectDraft(state, jobId, audience);
  const docRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pendingSel, setPendingSel] = useState<PendingSel | null>(null);
  const actions = useDocActions(jobId, audience);

  // Clear the floating toolbar whenever the document identity changes.
  useEffect(() => setPendingSel(null), [jobId, audience, state.wsMode]);

  const onMouseUp = () => {
    // Let the browser finish updating the selection before reading it.
    setTimeout(() => {
      const sel = window.getSelection();
      const txt = sel?.toString().trim();
      if (!txt || txt.length < 2 || state.wsMode === "viewing") return setPendingSel(null);
      if (!sel?.anchorNode || !docRef.current?.contains(sel.anchorNode)) return setPendingSel(null);
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      const wrap = wrapRef.current;
      if (!wrap) return;
      const wrapRect = wrap.getBoundingClientRect();
      const blockEl = (sel.anchorNode.parentElement as HTMLElement | null)?.closest(".doc-block");
      setPendingSel({
        text: txt,
        blockId: blockEl?.getAttribute("data-block-id") ?? null,
        top: Math.max(4, rect.top - wrapRect.top - 44 + wrap.scrollTop),
        left: Math.max(0, rect.left - wrapRect.left),
      });
    }, 5);
  };

  const outline = draft.blocks.filter((b) => b.kind === "h2");

  return (
    <>
      <div className="jw-toolbar">
        <div className="jw-mode-tabs">
          {MODES.map((m) => (
            <button
              key={m}
              className={`jw-mode-tab${state.wsMode === m ? " active" : ""}`}
              onClick={() => set({ wsMode: m })}
            >
              {t(m.charAt(0).toUpperCase() + m.slice(1))}
            </button>
          ))}
        </div>
        <div className="tb-sep" />
        <div className="jw-mode-tabs">
          <button
            className={`jw-mode-tab${audience === "internal" ? " active" : ""}`}
            onClick={() => actions.setAudience("internal")}
          >
            {t("Internal")}
          </button>
          <button
            className={`jw-mode-tab${audience === "external" ? " active" : ""}`}
            onClick={() => actions.setAudience("external")}
          >
            {t("External")}
          </button>
        </div>
        <div className="tb-sep" />
        <button className="tb-btn" title={t("Bold")}>
          <Icon name="format_bold" />
        </button>
        <button className="tb-btn" title={t("Italic")}>
          <Icon name="format_italic" />
        </button>
        <button className="tb-btn" title={t("Bulleted list")}>
          <Icon name="format_list_bulleted" />
        </button>
        <button
          className="tb-btn"
          title={t("Undo")}
          onClick={() => say(t("Undo creates a new draft revision — it does not remove history."))}
        >
          <Icon name="undo" />
        </button>
        <button className="tb-btn" title={t("Find")}>
          <Icon name="search" />
        </button>
        <div style={{ flex: 1 }} />
        <span className="jw-save-state">
          <Icon name={draft.saveState === "saving" ? "sync" : "cloud_done"} />
          {draft.saveState === "saving" ? t("Saving…") : t("Saved")}
        </span>
      </div>

      <div className="jw-body">
        <div className="jw-outline">
          <div
            className="tiny"
            style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", padding: "0 10px 8px" }}
          >
            {t("Outline")}
          </div>
          {outline.map((b) => (
            <div key={b.id} className="jw-outline-item" onClick={() => scrollToBlock(b.id)}>
              {typeof b.text === "string" ? b.text : ""}
            </div>
          ))}
        </div>

        <div className="jw-doc-wrap" ref={wrapRef}>
          <div className="jw-doc" ref={docRef} onMouseUp={onMouseUp}>
            {audience === "external" && (
              <div className="info-inline" style={{ marginBottom: 18 }}>
                {t("Candidate-facing version")} • {t("source")}: {t("role")} v
                {state.jobs[jobId].activeRoleVersionRef
                  ? state.roleVersions[state.jobs[jobId].activeRoleVersionRef!]?.versionNo
                  : "—"}{" "}
                • {draft.reviewStatus === "reviewed" ? t("Reviewed") : t("Needs review")}
              </div>
            )}
            {draft.blocks.map((b) => (
              <DocBlockView key={b.id} block={b} jobId={jobId} audience={audience} />
            ))}
          </div>
          {pendingSel && (
            <div className="sel-toolbar" style={{ position: "absolute", top: pendingSel.top, left: pendingSel.left }}>
              <button
                onClick={() => {
                  actions.askCopilotFromSelection(pendingSel.blockId, pendingSel.text);
                  setPendingSel(null);
                }}
              >
                <Icon name="auto_awesome" />
                {t("Ask Copilot")}
              </button>
              {(["rewrite", "shorten", "clarify"] as const).map((kind) => (
                <button
                  key={kind}
                  onClick={() => {
                    actions.quickAction(pendingSel.blockId, pendingSel.text, kind);
                    setPendingSel(null);
                  }}
                >
                  <Icon name={kind === "rewrite" ? "edit" : kind === "shorten" ? "short_text" : "lightbulb"} />
                  {t(kind.charAt(0).toUpperCase() + kind.slice(1))}
                </button>
              ))}
              <button
                onClick={() => {
                  actions.addCommentFromSelection(pendingSel.blockId, pendingSel.text);
                  setPendingSel(null);
                }}
              >
                <Icon name="add_comment" />
                {t("Comment")}
              </button>
            </div>
          )}
        </div>

        <SidePanel jobId={jobId} audience={audience} />
      </div>
    </>
  );
}

/* ---------------------------------------------------------------
   One document block, with inline suggestion marks and comment anchors.
   --------------------------------------------------------------- */
function DocBlockView({ block, jobId, audience }: { block: DocBlock; jobId: string; audience: Audience }) {
  const { state, t } = useStore();
  const actions = useDocActions(jobId, audience);
  const suggestions = pendingSuggestionsFor(state, jobId, audience, block.id);
  const threads = selectThreads(state, jobId, audience).filter((x) => x.anchorBlock === block.id);
  const openThreadCount = threads.filter((x) => x.status === "open").length;
  const hasStale = selectSuggestions(state, jobId, audience).some(
    (s) => s.status === "stale" && s.anchorBlock === block.id,
  );

  const marked = (text: string) => {
    const active = suggestions.find((s) => s.oldText && text.includes(s.oldText));
    if (!active) return text;
    const [before, ...rest] = text.split(active.oldText);
    return (
      <>
        {before}
        <span className="del">{active.oldText}</span>
        <span className="ins">{active.newText}</span>
        <span className={`mark-badge ${active.author === "ai" ? "ai" : "human"}`}>
          {active.author === "ai" ? "AI" : "Maya"}
        </span>
        {rest.join(active.oldText)}
      </>
    );
  };

  return (
    <div className={`doc-block${openThreadCount > 0 ? " has-comment" : ""}`} data-block-id={block.id}>
      {block.kind === "h2" && <h2 className="docH">{marked(block.text as string)}</h2>}
      {block.kind === "h3" && <h3 className="docH3">{marked(block.text as string)}</h3>}
      {block.kind === "p" && (
        <p className={`docP${block.role === "requirement" ? "" : " presentation-only"}`}>{marked(block.text as string)}</p>
      )}
      {block.kind === "ul" && (
        <ul className="docList">
          {(block.text as string[]).map((x, i) => (
            <li key={i}>{marked(x)}</li>
          ))}
        </ul>
      )}
      {openThreadCount > 0 && (
        <span
          className="comment-anchor"
          title={`${openThreadCount} ${t("comment(s)")}`}
          onClick={() => actions.openCommentsFor(block.id)}
        >
          {openThreadCount}
        </span>
      )}
      {hasStale && (
        <span className="stale-flag">
          <Icon name="restore" size={11} />
          {t("Needs refresh")}
        </span>
      )}
    </div>
  );
}
