"use client";

import { useMemo, useState } from "react";
import type { LLMProviderLog, RateLimitLog } from "@/types/database";
import styles from "./AdminDiagnostics.module.css";

type AdminDiagnosticsProps = {
  providerLogs: LLMProviderLog[];
  rateLimitLogs: RateLimitLog[];
};

const PAGE_SIZE = 10;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getProviderStatusClass(status: string) {
  if (status === "success") return styles.successBadge;
  if (status === "rate_limited" || status === "timeout") {
    return styles.warningBadge;
  }

  return styles.errorBadge;
}

function getRateLimitStatusClass(eventType: string) {
  return eventType === "allowed" ? styles.successBadge : styles.errorBadge;
}

function getTotalPages(totalItems: number) {
  return Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
}

function paginate<T>(items: T[], page: number) {
  const start = (page - 1) * PAGE_SIZE;
  return items.slice(start, start + PAGE_SIZE);
}

function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className={styles.pagination}>
      <button
        type="button"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </button>

      <span>
        Page {currentPage} of {totalPages}
      </span>

      <button
        type="button"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </button>
    </div>
  );
}

export function AdminDiagnostics({
  providerLogs,
  rateLimitLogs,
}: AdminDiagnosticsProps) {
  const [providerPage, setProviderPage] = useState(1);
  const [rateLimitPage, setRateLimitPage] = useState(1);

  const providerTotalPages = getTotalPages(providerLogs.length);
  const rateLimitTotalPages = getTotalPages(rateLimitLogs.length);

  const visibleProviderLogs = useMemo(
    () => paginate(providerLogs, providerPage),
    [providerLogs, providerPage]
  );

  const visibleRateLimitLogs = useMemo(
    () => paginate(rateLimitLogs, rateLimitPage),
    [rateLimitLogs, rateLimitPage]
  );

  const successfulProviderCalls = providerLogs.filter(
    (log) => log.status === "success"
  ).length;

  const failedProviderCalls = providerLogs.filter(
    (log) => log.status !== "success"
  ).length;

  const blockedRateLimitEvents = rateLimitLogs.filter(
    (log) => log.event_type === "blocked"
  ).length;

  return (
    <div className={styles.wrapper}>
      <section className={styles.summaryGrid} aria-label="Diagnostics summary">
        <article className={styles.summaryCard}>
          <span>Provider successes</span>
          <strong>{successfulProviderCalls}</strong>
        </article>

        <article className={styles.summaryCard}>
          <span>Provider failures</span>
          <strong>{failedProviderCalls}</strong>
        </article>

        <article className={styles.summaryCard}>
          <span>Rate-limit blocks</span>
          <strong>{blockedRateLimitEvents}</strong>
        </article>
      </section>

      <section className={styles.card}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>LLM activity</p>
            <h2>Recent provider logs</h2>
          </div>
          <span className={styles.count}>{providerLogs.length} rows</span>
        </div>

        {providerLogs.length === 0 ? (
          <p className={styles.emptyText}>No provider logs are available yet.</p>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Model</th>
                    <th>Status</th>
                    <th>Latency</th>
                    <th>Error</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProviderLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.provider_name}</td>
                      <td>{log.model_name || "Not available"}</td>
                      <td>
                        <span className={getProviderStatusClass(log.status)}>
                          {log.status}
                        </span>
                      </td>
                      <td>{log.latency_ms} ms</td>
                      <td>{log.error_message || "None"}</td>
                      <td>{formatDate(log.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <PaginationControls
              currentPage={providerPage}
              totalPages={providerTotalPages}
              onPageChange={setProviderPage}
            />
          </>
        )}
      </section>

      <section className={styles.card}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Traffic control</p>
            <h2>Recent rate-limit logs</h2>
          </div>
          <span className={styles.count}>{rateLimitLogs.length} rows</span>
        </div>

        {rateLimitLogs.length === 0 ? (
          <p className={styles.emptyText}>
            No rate-limit logs are available yet.
          </p>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Scope</th>
                    <th>Event</th>
                    <th>Reason</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRateLimitLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.scope}</td>
                      <td>
                        <span className={getRateLimitStatusClass(log.event_type)}>
                          {log.event_type}
                        </span>
                      </td>
                      <td>{log.reason}</td>
                      <td>{formatDate(log.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <PaginationControls
              currentPage={rateLimitPage}
              totalPages={rateLimitTotalPages}
              onPageChange={setRateLimitPage}
            />
          </>
        )}
      </section>
    </div>
  );
}