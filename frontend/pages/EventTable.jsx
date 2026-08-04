import React, { useState, useMemo } from 'react';
import securityData from './securityData.js';

/**
 * EventTable Component
 * Dark Cybersecurity Dashboard Theme Table
 * 
 * Features:
 * - Uses actual Excel security dataset (1,800 records)
 * - 10 Required Columns: event_id, timestamp, event_type, severity, source_ip, destination_ip, username, asset_name, event_status, risk_score
 * - Dark Cybersecurity Dashboard Theme (Slate/Glassmorphism with Neon Accents)
 * - Sticky Table Header
 * - Multi-field Search (Event ID, Username, IP Address, Event Type)
 * - Quick Filters (Severity & Status)
 * - Sortable Columns (Ascending / Descending with visual indicators)
 * - Pagination (10 rows per page with page controls)
 * - Severity Badges: Critical (Red), High (Orange), Medium (Yellow), Low (Green)
 * - Status Badges: Success (Green), Failed (Red)
 * - Risk Score formatted to 1 decimal place with visual risk indicator
 * - CSV Export capability
 */

export const EventTable = ({ data = securityData }) => {
    // Search & Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [severityFilter, setSeverityFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Sorting state
    const [sortColumn, setSortColumn] = useState('timestamp');
    const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Filter dataset based on search term & filter dropdowns
    const filteredData = useMemo(() => {
        return data.filter((item) => {
            // 1. Search Query Filter (Event ID, Username, Source IP, Destination IP, Event Type)
            const query = searchTerm.trim().toLowerCase();
            if (query) {
                const matchId = String(item.event_id || '').toLowerCase().includes(query);
                const matchUser = String(item.username || '').toLowerCase().includes(query);
                const matchSrcIp = String(item.source_ip || '').toLowerCase().includes(query);
                const matchDstIp = String(item.destination_ip || '').toLowerCase().includes(query);
                const matchType = String(item.event_type || '').toLowerCase().includes(query);

                if (!matchId && !matchUser && !matchSrcIp && !matchDstIp && !matchType) {
                    return false;
                }
            }

            // 2. Severity Quick Filter
            if (severityFilter !== 'ALL' && String(item.severity).toUpperCase() !== severityFilter) {
                return false;
            }

            // 3. Status Quick Filter
            if (statusFilter !== 'ALL' && String(item.event_status).toUpperCase() !== statusFilter) {
                return false;
            }

            return true;
        });
    }, [data, searchTerm, severityFilter, statusFilter]);

    // Sort dataset
    const sortedData = useMemo(() => {
        if (!sortColumn) return filteredData;

        return [...filteredData].sort((a, b) => {
            let valA = a[sortColumn];
            let valB = b[sortColumn];

            // Handle numerical sort for risk_score
            if (sortColumn === 'risk_score') {
                valA = Number(valA) || 0;
                valB = Number(valB) || 0;
            } else {
                // String sort
                valA = String(valA || '').toLowerCase();
                valB = String(valB || '').toLowerCase();
            }

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortColumn, sortDirection]);

    // Pagination calculation
    const totalRecords = sortedData.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

    // Reset page when search or filters change
    const activePage = Math.min(currentPage, totalPages);

    const paginatedData = useMemo(() => {
        const startIndex = (activePage - 1) * pageSize;
        return sortedData.slice(startIndex, startIndex + pageSize);
    }, [sortedData, activePage, pageSize]);

    // Handle header sort click
    const handleSort = (columnKey) => {
        if (sortColumn === columnKey) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortColumn(columnKey);
            setSortDirection('asc');
        }
    };

    // Helper for Severity Badge Styling
    const getSeverityBadge = (severity) => {
        const sev = String(severity || '').toLowerCase();
        switch (sev) {
            case 'critical':
                return {
                    bg: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    dot: '#ef4444',
                    label: 'Critical'
                };
            case 'high':
                return {
                    bg: 'rgba(249, 115, 22, 0.15)',
                    color: '#fb923c',
                    border: '1px solid rgba(249, 115, 22, 0.4)',
                    dot: '#f97316',
                    label: 'High'
                };
            case 'medium':
                return {
                    bg: 'rgba(234, 179, 8, 0.15)',
                    color: '#facc15',
                    border: '1px solid rgba(234, 179, 8, 0.4)',
                    dot: '#eab308',
                    label: 'Medium'
                };
            case 'low':
                return {
                    bg: 'rgba(34, 197, 94, 0.15)',
                    color: '#4ade80',
                    border: '1px solid rgba(34, 197, 94, 0.4)',
                    dot: '#22c55e',
                    label: 'Low'
                };
            default:
                return {
                    bg: 'rgba(148, 163, 184, 0.15)',
                    color: '#94a3b8',
                    border: '1px solid rgba(148, 163, 184, 0.4)',
                    dot: '#94a3b8',
                    label: severity || 'Unknown'
                };
        }
    };

    // Helper for Event Status Badge Styling
    const getStatusBadge = (status) => {
        const st = String(status || '').toLowerCase();
        if (st === 'success') {
            return {
                bg: 'rgba(34, 197, 94, 0.15)',
                color: '#4ade80',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                icon: '✓',
                label: 'Success'
            };
        } else if (st === 'failed') {
            return {
                bg: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                icon: '✕',
                label: 'Failed'
            };
        }
        return {
            bg: 'rgba(148, 163, 184, 0.15)',
            color: '#94a3b8',
            border: '1px solid rgba(148, 163, 184, 0.4)',
            icon: '•',
            label: status || 'N/A'
        };
    };

    // Helper for Risk Score Styling
    const getRiskScoreStyle = (score) => {
        const num = Number(score) || 0;
        if (num >= 70) return { color: '#f87171', barBg: '#ef4444' }; // High alert
        if (num >= 40) return { color: '#fb923c', barBg: '#f97316' }; // Warning
        if (num >= 20) return { color: '#facc15', barBg: '#eab308' }; // Moderate
        return { color: '#4ade80', barBg: '#22c55e' }; // Low risk
    };

    // Export filtered dataset to CSV
    const exportToCSV = () => {
        const headers = [
            'Event ID',
            'Timestamp',
            'Event Type',
            'Severity',
            'Source IP',
            'Destination IP',
            'Username',
            'Asset Name',
            'Event Status',
            'Risk Score'
        ];

        const csvRows = [
            headers.join(','),
            ...sortedData.map((row) =>
                [
                    `"${row.event_id || ''}"`,
                    `"${row.timestamp || ''}"`,
                    `"${row.event_type || ''}"`,
                    `"${row.severity || ''}"`,
                    `"${row.source_ip || ''}"`,
                    `"${row.destination_ip || ''}"`,
                    `"${row.username || ''}"`,
                    `"${row.asset_name || ''}"`,
                    `"${row.event_status || ''}"`,
                    `"${(Number(row.risk_score) || 0).toFixed(1)}"`
                ].join(',')
            )
        ];

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `security_events_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Table Columns Definition
    const columns = [
        { key: 'event_id', label: 'Event ID', minWidth: '110px' },
        { key: 'timestamp', label: 'Timestamp', minWidth: '160px' },
        { key: 'event_type', label: 'Event Type', minWidth: '140px' },
        { key: 'severity', label: 'Severity', minWidth: '120px' },
        { key: 'source_ip', label: 'Source IP', minWidth: '130px' },
        { key: 'destination_ip', label: 'Destination IP', minWidth: '130px' },
        { key: 'username', label: 'Username', minWidth: '120px' },
        { key: 'asset_name', label: 'Asset Name', minWidth: '140px' },
        { key: 'event_status', label: 'Status', minWidth: '110px' },
        { key: 'risk_score', label: 'Risk Score', minWidth: '120px' }
    ];

    return (
        <div style={styles.container}>
            {/* Scope CSS styling */}
            <style>{customCSS}</style>

            {/* Control Panel / Header */}
            <div style={styles.headerPanel}>
                <div style={styles.titleSection}>
                    <div style={styles.titleBadge}>
                        <span style={styles.liveIndicator}></span>
                        <span style={styles.titleText}>SECURITY EVENT MONITOR</span>
                    </div>
                    <div style={styles.recordCounter}>
                        {totalRecords.toLocaleString()} Events Detected
                    </div>
                </div>

                {/* Search Box & Controls */}
                <div style={styles.controlsRow}>
                    {/* Search Box */}
                    <div style={styles.searchWrapper}>
                        <span style={styles.searchIcon}>🔍</span>
                        <input
                            type="text"
                            placeholder="Search by Event ID, Username, IP, or Event Type..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            style={styles.searchInput}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                style={styles.clearSearchBtn}
                                title="Clear Search"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Severity Filter */}
                    <div style={styles.filterGroup}>
                        <label style={styles.filterLabel}>Severity:</label>
                        <select
                            value={severityFilter}
                            onChange={(e) => {
                                setSeverityFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            style={styles.selectInput}
                        >
                            <option value="ALL">All Severities</option>
                            <option value="CRITICAL">Critical</option>
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div style={styles.filterGroup}>
                        <label style={styles.filterLabel}>Status:</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            style={styles.selectInput}
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="SUCCESS">Success</option>
                            <option value="FAILED">Failed</option>
                        </select>
                    </div>

                    {/* CSV Export Button */}
                    <button onClick={exportToCSV} style={styles.exportBtn} title="Export Filtered Events to CSV">
                        📥 Export CSV
                    </button>
                </div>
            </div>

            {/* Main Table Scroll Container */}
            <div style={styles.tableScrollContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            {columns.map((col) => {
                                const isSorted = sortColumn === col.key;
                                return (
                                    <th
                                        key={col.key}
                                        onClick={() => handleSort(col.key)}
                                        style={{
                                            ...styles.th,
                                            minWidth: col.minWidth,
                                            backgroundColor: isSorted ? '#1e293b' : '#0f172a'
                                        }}
                                        className="cyber-th"
                                    >
                                        <div style={styles.thContent}>
                                            <span>{col.label}</span>
                                            <span style={styles.sortIndicator}>
                                                {isSorted ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                                            </span>
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((row, index) => {
                                const sevStyle = getSeverityBadge(row.severity);
                                const statusStyle = getStatusBadge(row.event_status);
                                const riskStyle = getRiskScoreStyle(row.risk_score);
                                const formattedRisk = (Number(row.risk_score) || 0).toFixed(1);

                                return (
                                    <tr
                                        key={row.event_id + '-' + index}
                                        style={{
                                            ...styles.tr,
                                            backgroundColor: index % 2 === 0 ? 'rgba(15, 23, 42, 0.6)' : 'rgba(30, 41, 59, 0.4)'
                                        }}
                                        className="cyber-tr"
                                    >
                                        {/* 1. Event ID */}
                                        <td style={{ ...styles.td, ...styles.monoText, color: '#38bdf8', fontWeight: '600' }}>
                                            {row.event_id}
                                        </td>

                                        {/* 2. Timestamp */}
                                        <td style={{ ...styles.td, ...styles.monoText, color: '#94a3b8', fontSize: '12px' }}>
                                            {row.timestamp}
                                        </td>

                                        {/* 3. Event Type */}
                                        <td style={{ ...styles.td, fontWeight: '500', color: '#e2e8f0' }}>
                                            <span style={styles.eventTypeTag}>{row.event_type}</span>
                                        </td>

                                        {/* 4. Severity Badge */}
                                        <td style={styles.td}>
                                            <span
                                                style={{
                                                    ...styles.badge,
                                                    backgroundColor: sevStyle.bg,
                                                    color: sevStyle.color,
                                                    border: sevStyle.border
                                                }}
                                            >
                                                <span style={{ ...styles.badgeDot, backgroundColor: sevStyle.dot }}></span>
                                                {sevStyle.label}
                                            </span>
                                        </td>

                                        {/* 5. Source IP */}
                                        <td style={{ ...styles.td, ...styles.monoText, color: '#cbd5e1' }}>
                                            {row.source_ip}
                                        </td>

                                        {/* 6. Destination IP */}
                                        <td style={{ ...styles.td, ...styles.monoText, color: '#cbd5e1' }}>
                                            {row.destination_ip}
                                        </td>

                                        {/* 7. Username */}
                                        <td style={{ ...styles.td, color: '#f1f5f9' }}>
                                            <span style={styles.userWrapper}>
                                                <span style={styles.userAvatar}>👤</span>
                                                {row.username}
                                            </span>
                                        </td>

                                        {/* 8. Asset Name */}
                                        <td style={{ ...styles.td, color: '#94a3b8', fontSize: '13px' }}>
                                            🖥️ {row.asset_name}
                                        </td>

                                        {/* 9. Event Status Badge */}
                                        <td style={styles.td}>
                                            <span
                                                style={{
                                                    ...styles.badge,
                                                    backgroundColor: statusStyle.bg,
                                                    color: statusStyle.color,
                                                    border: statusStyle.border
                                                }}
                                            >
                                                <span style={{ marginRight: '4px', fontSize: '11px' }}>{statusStyle.icon}</span>
                                                {statusStyle.label}
                                            </span>
                                        </td>

                                        {/* 10. Risk Score (Formatted to 1 decimal place) */}
                                        <td style={styles.td}>
                                            <div style={styles.riskContainer}>
                                                <span
                                                    style={{
                                                        ...styles.riskText,
                                                        color: riskStyle.color
                                                    }}
                                                >
                                                    {formattedRisk}
                                                </span>
                                                <div style={styles.riskBarTrack}>
                                                    <div
                                                        style={{
                                                            ...styles.riskBarFill,
                                                            width: `${Math.min(100, Math.max(0, row.risk_score))}%`,
                                                            backgroundColor: riskStyle.barBg
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={10} style={styles.emptyTd}>
                                    <div style={styles.emptyStateContainer}>
                                        <span style={{ fontSize: '36px', marginBottom: '10px' }}>🔍</span>
                                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#f1f5f9' }}>
                                            No Security Events Found
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                                            Try adjusting your search keywords or filter options.
                                        </div>
                                        {(searchTerm || severityFilter !== 'ALL' || statusFilter !== 'ALL') && (
                                            <button
                                                onClick={() => {
                                                    setSearchTerm('');
                                                    setSeverityFilter('ALL');
                                                    setStatusFilter('ALL');
                                                    setCurrentPage(1);
                                                }}
                                                style={styles.resetFiltersBtn}
                                            >
                                                Reset All Filters
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div style={styles.paginationPanel}>
                <div style={styles.paginationInfo}>
                    Showing{' '}
                    <strong style={{ color: '#38bdf8' }}>
                        {totalRecords === 0 ? 0 : (activePage - 1) * pageSize + 1}
                    </strong>{' '}
                    to{' '}
                    <strong style={{ color: '#38bdf8' }}>
                        {Math.min(activePage * pageSize, totalRecords)}
                    </strong>{' '}
                    of <strong style={{ color: '#f1f5f9' }}>{totalRecords.toLocaleString()}</strong> entries
                </div>

                {/* Page Selector & Controls */}
                <div style={styles.paginationControls}>
                    <div style={styles.pageSizeSelector}>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Rows per page:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            style={styles.pageSizeSelect}
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>

                    {/* Navigation Buttons */}
                    <div style={styles.buttonGroup}>
                        <button
                            onClick={() => setCurrentPage(1)}
                            disabled={activePage === 1}
                            style={{
                                ...styles.pageBtn,
                                opacity: activePage === 1 ? 0.4 : 1,
                                cursor: activePage === 1 ? 'not-allowed' : 'pointer'
                            }}
                            title="First Page"
                        >
                            ««
                        </button>
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={activePage === 1}
                            style={{
                                ...styles.pageBtn,
                                opacity: activePage === 1 ? 0.4 : 1,
                                cursor: activePage === 1 ? 'not-allowed' : 'pointer'
                            }}
                            title="Previous Page"
                        >
                            ‹ Prev
                        </button>

                        <span style={styles.pageIndicator}>
                            Page <strong style={{ color: '#38bdf8' }}>{activePage}</strong> of{' '}
                            <strong>{totalPages}</strong>
                        </span>

                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={activePage >= totalPages}
                            style={{
                                ...styles.pageBtn,
                                opacity: activePage >= totalPages ? 0.4 : 1,
                                cursor: activePage >= totalPages ? 'not-allowed' : 'pointer'
                            }}
                            title="Next Page"
                        >
                            Next ›
                        </button>
                        <button
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={activePage >= totalPages}
                            style={{
                                ...styles.pageBtn,
                                opacity: activePage >= totalPages ? 0.4 : 1,
                                cursor: activePage >= totalPages ? 'not-allowed' : 'pointer'
                            }}
                            title="Last Page"
                        >
                            »»
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Dark Cybersecurity Dashboard Inline Styling Object
const styles = {
    container: {
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: '#0b0f19',
        color: '#e2e8f0',
        borderRadius: '12px',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        width: '100%',
        margin: '0 auto'
    },
    headerPanel: {
        padding: '16px 20px',
        backgroundColor: '#0f172a',
        borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
    },
    titleSection: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
    },
    titleBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    liveIndicator: {
        width: '10px',
        height: '10px',
        backgroundColor: '#10b981',
        borderRadius: '50%',
        boxShadow: '0 0 10px #10b981',
        display: 'inline-block'
    },
    titleText: {
        fontSize: '16px',
        fontWeight: '700',
        letterSpacing: '0.05em',
        color: '#f8fafc',
        textTransform: 'uppercase'
    },
    recordCounter: {
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        color: '#38bdf8',
        padding: '4px 10px',
        borderRadius: '20px',
        border: '1px solid rgba(56, 189, 248, 0.3)'
    },
    controlsRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center'
    },
    searchWrapper: {
        position: 'relative',
        flex: '1 1 300px',
        display: 'flex',
        alignItems: 'center'
    },
    searchIcon: {
        position: 'absolute',
        left: '12px',
        fontSize: '14px',
        color: '#64748b'
    },
    searchInput: {
        width: '100%',
        padding: '9px 36px 9px 36px',
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        border: '1px solid #334155',
        borderRadius: '8px',
        fontSize: '13px',
        outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s'
    },
    clearSearchBtn: {
        position: 'absolute',
        right: '10px',
        background: 'none',
        border: 'none',
        color: '#94a3b8',
        cursor: 'pointer',
        fontSize: '14px'
    },
    filterGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
    },
    filterLabel: {
        fontSize: '12px',
        color: '#94a3b8',
        fontWeight: '500'
    },
    selectInput: {
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        border: '1px solid #334155',
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '13px',
        outline: 'none',
        cursor: 'pointer'
    },
    exportBtn: {
        backgroundColor: 'rgba(56, 189, 248, 0.15)',
        color: '#38bdf8',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        borderRadius: '8px',
        padding: '8px 14px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        marginLeft: 'auto'
    },
    tableScrollContainer: {
        maxHeight: '600px',
        overflowY: 'auto',
        overflowX: 'auto',
        backgroundColor: '#0b0f19',
        position: 'relative'
    },
    table: {
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: 0,
        textAlign: 'left',
        fontSize: '13px'
    },
    th: {
        position: 'sticky',
        top: 0,
        zIndex: 10,
        color: '#94a3b8',
        fontSize: '12px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        padding: '12px 14px',
        borderBottom: '2px solid #1e293b',
        cursor: 'pointer',
        userSelect: 'none'
    },
    thContent: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '6px'
    },
    sortIndicator: {
        fontSize: '11px',
        color: '#38bdf8'
    },
    tr: {
        transition: 'background-color 0.15s ease'
    },
    td: {
        padding: '12px 14px',
        borderBottom: '1px solid rgba(30, 41, 59, 0.7)',
        whiteSpace: 'nowrap'
    },
    monoText: {
        fontFamily: 'Consolas, Monaco, "Courier New", monospace'
    },
    eventTypeTag: {
        backgroundColor: '#1e293b',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        border: '1px solid #334155'
    },
    badge: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        letterSpacing: '0.02em'
    },
    badgeDot: {
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        marginRight: '6px'
    },
    userWrapper: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px'
    },
    userAvatar: {
        fontSize: '12px'
    },
    riskContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        width: '90px'
    },
    riskText: {
        fontSize: '12px',
        fontWeight: '700',
        fontFamily: 'Consolas, monospace'
    },
    riskBarTrack: {
        height: '4px',
        backgroundColor: '#1e293b',
        borderRadius: '2px',
        overflow: 'hidden'
    },
    riskBarFill: {
        height: '100%',
        borderRadius: '2px',
        transition: 'width 0.3s ease'
    },
    emptyTd: {
        padding: '40px 20px',
        textAlign: 'center'
    },
    emptyStateContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
    },
    resetFiltersBtn: {
        marginTop: '12px',
        backgroundColor: '#3b82f6',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        padding: '8px 16px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer'
    },
    paginationPanel: {
        padding: '14px 20px',
        backgroundColor: '#0f172a',
        borderTop: '1px solid rgba(56, 189, 248, 0.15)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px'
    },
    paginationInfo: {
        fontSize: '13px',
        color: '#94a3b8'
    },
    paginationControls: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap'
    },
    pageSizeSelector: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
    },
    pageSizeSelect: {
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        border: '1px solid #334155',
        borderRadius: '6px',
        padding: '4px 8px',
        fontSize: '12px',
        outline: 'none',
        cursor: 'pointer'
    },
    buttonGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
    },
    pageBtn: {
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        border: '1px solid #334155',
        borderRadius: '6px',
        padding: '6px 12px',
        fontSize: '12px',
        fontWeight: '600',
        transition: 'all 0.15s ease'
    },
    pageIndicator: {
        fontSize: '13px',
        color: '#94a3b8',
        padding: '0 6px'
    }
};

// Custom Scoped CSS for Hover States & Custom Scrollbars
const customCSS = `
  .cyber-th:hover {
    color: #38bdf8 !important;
  }
  .cyber-tr:hover {
    background-color: rgba(56, 189, 248, 0.08) !important;
  }
  /* Custom Dark Cyber Scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: #0b0f19;
  }
  ::-webkit-scrollbar-thumb {
    background: #1e293b;
    border-radius: 4px;
    border: 1px solid #334155;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #38bdf8;
  }
`;

export default EventTable;
