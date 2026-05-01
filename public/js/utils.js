const utils = {
    formatDate: (date) => {
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    },

    formatWeight: (weight) => `${weight.toFixed(2)} kg`,

    formatPercentage: (val) => `${(val * 100).toFixed(1)}%`,

    generateId: (prefix = 'Région') => {
        const hash = Math.random().toString(36).substring(2, 8).toUpperCase();
        const timestamp = Date.now().toString(36).substring(4).toUpperCase();
        return `(${prefix})-CC_${hash}${timestamp}`;
    },

    validateGPS: (coords) => {
        return coords && typeof coords.lat === 'number' && typeof coords.lng === 'number';
    },

    isValidWeight: (weight) => !isNaN(weight) && weight > 0,

    REGIONS: ["Sud-Ouest", "Est", "Centre", "Littoral"],
    SPECIES: ["Forastero", "Criollo", "Trinitario"],
    QUALITY_GRADES: ["Grade 1", "Grade 2", "Standard"],
    EUDR_CUTOFF_DATE: new Date("2020-12-31")
};
