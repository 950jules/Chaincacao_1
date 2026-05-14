/**
 * ChainCacao Form Validation
 * Validation robuste pour tous les formulaires avec messages d'erreur clairs
 */

const formValidation = {
    // Validation rules
    rules: {
        weight: {
            min: 0.5,
            max: 1000,
            validate: (value) => {
                const num = parseFloat(value);
                if (isNaN(num)) return { valid: false, error: 'Le poids doit être un nombre' };
                if (num < 0.5) return { valid: false, error: 'Le poids minimum est 0.5kg' };
                if (num > 1000) return { valid: false, error: 'Le poids maximum est 1000kg' };
                return { valid: true };
            }
        },
        
        gps: {
            validate: (value) => {
                if (!value || !value.lat || !value.lng) {
                    return { valid: false, error: 'Position GPS requise' };
                }
                if (typeof value.lat !== 'number' || typeof value.lng !== 'number') {
                    return { valid: false, error: 'Coordonnées GPS invalides' };
                }
                // Check if in Togo (approximately)
                if (value.lat < 6 || value.lat > 12 || value.lng < -3 || value.lng > 2) {
                    return { 
                        valid: false, 
                        error: 'Position hors de Togo. Assurez-vous que votre GPS est correct.' 
                    };
                }
                return { valid: true };
            }
        },
        
        region: {
            validate: (value) => {
                if (!value || value.trim().length === 0) {
                    return { valid: false, error: 'Sélectionnez une région' };
                }
                return { valid: true };
            }
        },
        
        species: {
            validate: (value) => {
                if (!value || value.trim().length === 0) {
                    return { valid: false, error: 'Sélectionnez une espèce' };
                }
                return { valid: true };
            }
        },
        
        photo: {
            validate: (value) => {
                // Photo is optional but if provided, check it's valid
                if (value && typeof value !== 'string') {
                    return { valid: false, error: 'Format de photo invalide' };
                }
                return { valid: true };
            }
        }
    },

    // Validate single field
    validateField(fieldName, value) {
        const rule = this.rules[fieldName];
        if (!rule) {
            console.warn(`No validation rule for field: ${fieldName}`);
            return { valid: true };
        }
        return rule.validate(value);
    },

    // Validate entire form
    validateForm(formData) {
        const errors = {};
        let isValid = true;

        for (const [field, value] of Object.entries(formData)) {
            const result = this.validateField(field, value);
            if (!result.valid) {
                errors[field] = result.error;
                isValid = false;
            }
        }

        return { isValid, errors };
    },

    // Display error message for a field
    showFieldError(fieldName, errorMessage) {
        const field = document.getElementById(`f-${fieldName}`);
        if (!field) return;

        field.classList.add('error-field');
        field.setAttribute('title', errorMessage);

        // Show inline error message if there's room
        let errorDisplay = field.nextElementSibling;
        if (!errorDisplay || !errorDisplay.classList.contains('field-error')) {
            errorDisplay = document.createElement('div');
            errorDisplay.className = 'field-error';
            field.parentNode.insertBefore(errorDisplay, field.nextSibling);
        }
        errorDisplay.textContent = `❌ ${errorMessage}`;
        errorDisplay.style.display = 'block';
    },

    // Clear field error
    clearFieldError(fieldName) {
        const field = document.getElementById(`f-${fieldName}`);
        if (!field) return;

        field.classList.remove('error-field');
        field.removeAttribute('title');

        const errorDisplay = field.nextElementSibling;
        if (errorDisplay && errorDisplay.classList.contains('field-error')) {
            errorDisplay.style.display = 'none';
        }
    },

    // Display all errors
    displayFormErrors(errors) {
        Object.entries(errors).forEach(([field, message]) => {
            this.showFieldError(field, message);
        });
    },

    // Clear all errors
    clearFormErrors() {
        const errorFields = document.querySelectorAll('.error-field');
        errorFields.forEach(field => {
            field.classList.remove('error-field');
            field.removeAttribute('title');
        });

        const errorMessages = document.querySelectorAll('.field-error');
        errorMessages.forEach(msg => {
            msg.style.display = 'none';
        });
    }
};

window.formValidation = formValidation;
