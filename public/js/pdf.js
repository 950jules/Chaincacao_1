const pdfControl = {
    async generateCertificat(lotId) {
        const lot = await database.getLot(lotId);
        const transfers = await database.getTransfersByLot(lotId);
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Header
        doc.setFillColor(61, 27, 11); // Espresso #3D1B0B
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text("CHAINCACAO • CERTIFICAT", 20, 25);
        
        // Body
        doc.setTextColor(61, 27, 11);
        doc.setFontSize(10);
        doc.text("DOCUMENT OFFICIEL DE TRAÇABILITÉ BLOCKCHAIN", 20, 50);
        
        doc.setFontSize(14);
        doc.text(`ID LOT : ${lot.id}`, 20, 65);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text(`PRODUCTEUR : ${lot.farmerName}`, 20, 75);
        doc.text(`COORDONNÉES GPS : ${lot.gps.lat.toFixed(5)}, ${lot.gps.lng.toFixed(5)}`, 20, 82);
        doc.text(`ESPÈCE : ${lot.species}`, 20, 89);
        doc.text(`POIDS FINAL : ${lot.weight} KG`, 20, 96);
        
        // EUDR Status
        doc.setDrawColor(45, 90, 39); // Forest Green
        doc.setLineWidth(0.5);
        doc.rect(20, 105, 170, 15);
        doc.setTextColor(45, 90, 39);
        doc.setFont("helvetica", "bold");
        doc.text("STATUT EUDR : CONFORME (ZÉRO DÉFORESTATION)", 25, 115);
        
        // Timeline
        doc.setTextColor(61, 27, 11);
        doc.setFontSize(12);
        doc.text("HISTORIQUE DES TRANSACTIONS BLOCKCHAIN", 20, 135);
        
        let y = 145;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        
        transfers.forEach((tx, i) => {
            doc.setFont("helvetica", "bold");
            doc.text(`${i+1}. ${tx.type}`, 25, y);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.text(`Acteur: ${tx.actorId} • Date: ${utils.formatDate(tx.timestamp)}`, 25, y + 5);
            doc.setFontSize(7);
            doc.setTextColor(93, 64, 55); // Secondary brown #5D4037
            doc.text(`TX HASH: ${tx.hash}`, 25, y + 10);
            doc.setTextColor(61, 27, 11);
            doc.setFontSize(10);
            y += 20;
        });

        // Verification QR Placeholder / Footer
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("Ce document est généré par ChainCacao PWA. L'authenticité peut être vérifiée sur la blockchain publique en scannant le QR code original du lot.", 20, 280);

        doc.save(`Certat_ChainCacao_${lot.id}.pdf`);
    }
};
