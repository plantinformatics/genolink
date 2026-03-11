import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "./MetadataFieldsSettings.module.css";

import {
  METADATA_COLUMNS,
  DEFAULT_SELECTED_METADATA_COLUMNS,
  sanitizeSelectedColumns,
  saveSelectedColumnsToStorage,
} from "./MetadataColumns";

import { setMetadataSelectedColumns } from "../../redux/passport/passportActions";

export default function MetadataFieldsSettings() {
  const dispatch = useDispatch();

  const selectedFromRedux = useSelector(
    (s) => s.passport.metadataSelectedColumns,
  );

  const initialSelected = useMemo(
    () => sanitizeSelectedColumns(selectedFromRedux),
    [selectedFromRedux],
  );

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(initialSelected);

  React.useEffect(() => {
    setDraft(initialSelected);
  }, [initialSelected]);

  const toggle = (id) => {
    setDraft((prev) => {
      const set = new Set(prev);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return Array.from(set);
    });
  };

  const selectAll = () => setDraft(DEFAULT_SELECTED_METADATA_COLUMNS);
  const clearAll = () => setDraft([]);

  const onSave = () => {
    const final = draft.length > 0 ? draft : DEFAULT_SELECTED_METADATA_COLUMNS;

    dispatch(setMetadataSelectedColumns(final));
    saveSelectedColumnsToStorage(final);

    window.location.reload();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={styles.openButton}
        title="Choose metadata columns"
      >
        ⚙ View
      </button>

      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.header}>
              <h3 className={styles.title}>
                Select Metadata Columns to display
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={styles.closeButton}
              >
                ✕
              </button>
            </div>

            <div className={styles.actions}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={selectAll}
              >
                Select all
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={clearAll}
              >
                Clear
              </button>
            </div>

            <div className={styles.grid}>
              {METADATA_COLUMNS.map((c) => (
                <label key={c.id} className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={draft.includes(c.id)}
                    onChange={() => toggle(c.id)}
                  />
                  {c.label}
                </label>
              ))}
            </div>

            <div className={styles.footer}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={onSave}
              >
                Save & Refresh
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
