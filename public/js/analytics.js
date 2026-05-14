/**
 * ChainCacao Analytics Dashboard
 * Affiche les statistiques et métriques clés de l'application
 */

const analytics = {
    async getDashboardStats() {
        try {
            const allLots = await database.getAllLots();
            const allTransfers = await database.getAllTransfers?.() || [];
            
            const stats = {
                totalLots: allLots.length,
                totalWeight: allLots.reduce((sum, lot) => sum + (lot.weight || 0), 0),
                averageWeight: allLots.length > 0 ? (allLots.reduce((sum, lot) => sum + (lot.weight || 0), 0) / allLots.length).toFixed(1) : 0,
                
                // Status breakdown
                created: allLots.filter(l => l.status === 'CREATED').length,
                collected: allLots.filter(l => l.status === 'COLLECTED').length,
                exported: allLots.filter(l => l.status === 'EXPORTED').length,
                
                // Region distribution
                regions: {},
                cooperatives: {},
                
                // Transaction info
                totalTransactions: allTransfers.length,
                notarizations: allTransfers.filter(t => t.type === 'CREATION').length,
                collections: allTransfers.filter(t => t.type === 'COLLECTED').length,
                exports: allTransfers.filter(t => t.type === 'EXPORTED').length
            };
            
            // Count by region and cooperative
            allLots.forEach(lot => {
                if (lot.region) {
                    stats.regions[lot.region] = (stats.regions[lot.region] || 0) + 1;
                }
                if (lot.cooperative) {
                    stats.cooperatives[lot.cooperative] = (stats.cooperatives[lot.cooperative] || 0) + 1;
                }
            });
            
            return stats;
        } catch (error) {
            console.error('Analytics error:', error);
            return null;
        }
    },

    async renderDashboard() {
        const container = document.getElementById('analytics-dashboard');
        if (!container) return;
        
        const stats = await this.getDashboardStats();
        if (!stats) {
            container.innerHTML = '<div class="empty-state">Erreur chargement statistiques</div>';
            return;
        }
        
        const qualityScore = stats.totalLots > 0 
            ? ((stats.collected + stats.exported) / stats.totalLots * 100).toFixed(0)
            : 0;
        
        container.innerHTML = `
            <div class="analytics-grid">
                <!-- Main Metrics -->
                <div class="metric-card metric-primary">
                    <div class="metric-value">${stats.totalLots}</div>
                    <div class="metric-label">Lots Enregistrés</div>
                    <div class="metric-sub">${stats.totalWeight.toFixed(1)}kg total</div>
                </div>
                
                <div class="metric-card metric-success">
                    <div class="metric-value">${stats.collected}</div>
                    <div class="metric-label">Collectés</div>
                    <div class="metric-sub">Prêts pour export</div>
                </div>
                
                <div class="metric-card metric-info">
                    <div class="metric-value">${stats.notarizations}</div>
                    <div class="metric-label">Notarisations</div>
                    <div class="metric-sub">Sur Polygon ✓</div>
                </div>
                
                <div class="metric-card metric-accent">
                    <div class="metric-value">${qualityScore}%</div>
                    <div class="metric-label">Qualité</div>
                    <div class="metric-sub">Lots validés</div>
                </div>
            </div>
            
            <!-- Distribution Charts -->
            <div class="analytics-section">
                <h3 class="analytics-title">📊 Distribution par État</h3>
                <div class="status-distribution">
                    ${stats.created > 0 ? `
                        <div class="status-bar">
                            <div class="status-label">En Attente</div>
                            <div class="status-bar-container">
                                <div class="status-bar-fill" style="width:${(stats.created / stats.totalLots * 100)}%; background:#FFA500"></div>
                            </div>
                            <div class="status-count">${stats.created}</div>
                        </div>
                    ` : ''}
                    ${stats.collected > 0 ? `
                        <div class="status-bar">
                            <div class="status-label">Collectés</div>
                            <div class="status-bar-container">
                                <div class="status-bar-fill" style="width:${(stats.collected / stats.totalLots * 100)}%; background:#2D5A1B"></div>
                            </div>
                            <div class="status-count">${stats.collected}</div>
                        </div>
                    ` : ''}
                    ${stats.exported > 0 ? `
                        <div class="status-bar">
                            <div class="status-label">Exportés</div>
                            <div class="status-bar-container">
                                <div class="status-bar-fill" style="width:${(stats.exported / stats.totalLots * 100)}%; background:#0066CC"></div>
                            </div>
                            <div class="status-count">${stats.exported}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- Regional Distribution -->
            <div class="analytics-section">
                <h3 class="analytics-title">🗺️ Distribution Régionale</h3>
                <div class="region-list">
                    ${Object.entries(stats.regions).map(([region, count]) => `
                        <div class="region-item">
                            <span class="region-name">${region}</span>
                            <span class="region-count">${count} lots</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Cooperative Distribution -->
            ${Object.keys(stats.cooperatives).length > 0 ? `
                <div class="analytics-section">
                    <h3 class="analytics-title">🏢 Distribution par Coopérative</h3>
                    <div class="coop-list">
                        ${Object.entries(stats.cooperatives).map(([coop, count]) => `
                            <div class="coop-item">
                                <span class="coop-name">${coop}</span>
                                <span class="coop-count">${count} lots</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        `;
        
        // Refresh lucide icons
        if (window.lucide) lucide.createIcons();
    },

    // Refresh analytics every 30 seconds
    startAutoRefresh(intervalMs = 30000) {
        setInterval(() => {
            this.renderDashboard();
        }, intervalMs);
    }
};

window.analytics = analytics;
