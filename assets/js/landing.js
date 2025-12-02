/**
 * Landing Page Dynamic Content Loader
 * Fetches and renders services, destinations, and fleet from the database
 * 
 * Ruf Bac Tour Services
 */

(function() {
    'use strict';
    
    // Container selectors
    const SELECTORS = {
        destinations: '#destinations .row.g-4.mt-4',
        fleet: '#fleet .row.g-4.mt-4',
        services: '#services .row.g-4.mt-4',
        heroStats: '.hero-stats-tropical'
    };
    
    /**
     * Show loading state
     */
    function showLoading(container) {
        if (container) {
            container.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        }
    }
    
    /**
     * Show error state
     */
    function showError(container, message = 'Failed to load content') {
        if (container) {
            container.innerHTML = `<div class="col-12"><div class="alert alert-warning">${message}</div></div>`;
        }
    }
    
    /**
     * Render destination card
     */
    function renderDestinationCard(destination) {
        const imageStyle = destination.image_url 
            ? `background-image: url('${destination.image_url}'); background-size: cover; background-position: center;`
            : `background: linear-gradient(135deg, var(--ocean-teal), var(--soft-teal));`;
        
        return `
            <div class="col-md-6 col-lg-4">
                <div class="destination-card">
                    <div class="destination-image" style="${imageStyle}">
                        <span class="destination-name-overlay">${escapeHtml(destination.name)}</span>
                    </div>
                    <div class="destination-content">
                        <h4>${escapeHtml(destination.name)}</h4>
                        <p>${escapeHtml(destination.description || '')}</p>
                        <div class="destination-features">
                            <span><i class="bi bi-clock"></i> ${destination.duration_hours} Hours</span>
                            <span><i class="bi bi-people"></i> Up to ${destination.max_capacity}</span>
                        </div>
                        <a href="#hero" class="btn btn-outline-tropical">Explore</a>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render fleet card
     */
    function renderFleetCard(vehicle) {
        const featuredClass = vehicle.is_featured ? 'featured' : '';
        const featuredBadge = vehicle.is_featured ? '<div class="fleet-badge">Most Popular</div>' : '';
        
        const featuresList = Array.isArray(vehicle.features) 
            ? vehicle.features 
            : (vehicle.features ? vehicle.features.split(',').map(f => f.trim()) : []);
        
        const featuresHtml = featuresList.map(feature => 
            `<li><i class="bi bi-check-circle"></i> ${escapeHtml(feature)}</li>`
        ).join('');
        
        return `
            <div class="col-md-6 col-lg-4">
                <div class="fleet-card ${featuredClass}">
                    ${featuredBadge}
                    <div class="fleet-icon">
                        <i class="bi bi-car-front-fill"></i>
                    </div>
                    <h4>${escapeHtml(vehicle.vehicle_type)}</h4>
                    <p class="fleet-description">${escapeHtml(vehicle.description || '')}</p>
                    <ul class="fleet-features">
                        ${featuresHtml}
                    </ul>
                    <div class="fleet-pricing">
                        <span class="price-from">From</span>
                        <span class="price-amount">$${parseFloat(vehicle.price_per_day).toFixed(0)}</span>
                        <span class="price-period">/day</span>
                    </div>
                    <button class="btn btn-primary-tropical btn-block">Book Now</button>
                </div>
            </div>
        `;
    }
    
    /**
     * Render service card
     */
    function renderServiceCard(service) {
        const benefitsList = Array.isArray(service.benefits) 
            ? service.benefits 
            : (service.benefits ? service.benefits.split(',').map(b => b.trim()) : []);
        
        const benefitsHtml = benefitsList.map(benefit => 
            `<li>${escapeHtml(benefit)}</li>`
        ).join('');
        
        const iconClass = service.icon_class || 'bi bi-star';
        const accentClass = service.service_type === 'tour' ? 'accent' : '';
        
        return `
            <div class="col-md-4">
                <div class="service-card-tropical">
                    <div class="service-icon-tropical ${accentClass}">
                        <i class="${iconClass}"></i>
                    </div>
                    <h4>${escapeHtml(service.name)}</h4>
                    <p>${escapeHtml(service.description || '')}</p>
                    <ul class="service-benefits">
                        ${benefitsHtml}
                    </ul>
                </div>
            </div>
        `;
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Load destinations
     */
    async function loadDestinations() {
        const container = document.querySelector(SELECTORS.destinations);
        if (!container) return;
        
        showLoading(container);
        
        try {
            const response = await API.fetchDestinations(true); // Featured only
            const destinations = response.data?.destinations || [];
            
            if (destinations.length === 0) {
                container.innerHTML = '<div class="col-12"><p class="text-center text-muted">No destinations available at this time.</p></div>';
                return;
            }
            
            container.innerHTML = destinations.map(renderDestinationCard).join('');
        } catch (error) {
            console.error('Error loading destinations:', error);
            showError(container, 'Failed to load destinations. Please try again later.');
        }
    }
    
    /**
     * Load fleet
     */
    async function loadFleet() {
        const container = document.querySelector(SELECTORS.fleet);
        if (!container) return;
        
        showLoading(container);
        
        try {
            const response = await API.fetchFleet(false); // All fleet
            const fleet = response.data?.fleet || [];
            
            if (fleet.length === 0) {
                container.innerHTML = '<div class="col-12"><p class="text-center text-muted">No fleet vehicles available at this time.</p></div>';
                return;
            }
            
            container.innerHTML = fleet.map(renderFleetCard).join('');
        } catch (error) {
            console.error('Error loading fleet:', error);
            showError(container, 'Failed to load fleet. Please try again later.');
        }
    }
    
    /**
     * Load services
     */
    async function loadServices() {
        const container = document.querySelector(SELECTORS.services);
        if (!container) return;
        
        showLoading(container);
        
        try {
            const response = await API.fetchServices(); // All services
            const services = response.data?.services || [];
            
            if (services.length === 0) {
                container.innerHTML = '<div class="col-12"><p class="text-center text-muted">No services available at this time.</p></div>';
                return;
            }
            
            container.innerHTML = services.map(renderServiceCard).join('');
        } catch (error) {
            console.error('Error loading services:', error);
            showError(container, 'Failed to load services. Please try again later.');
        }
    }
    
    /**
     * Load hero stats (optional - can calculate from database)
     */
    async function loadHeroStats() {
        const container = document.querySelector(SELECTORS.heroStats);
        if (!container) return;
        
        try {
            // Fetch stats from bookings API if available
            const statsResponse = await API.fetchDashboardStats();
            const stats = statsResponse.data || {};
            
            // Update stats if needed
            // For now, keep the static values or update dynamically
            // This is optional and can be enhanced later
        } catch (error) {
            console.error('Error loading hero stats:', error);
            // Don't show error, just keep static values
        }
    }
    
    /**
     * Populate booking widget dropdowns (optional enhancement)
     */
    async function populateBookingWidgets() {
        try {
            // Load destinations for tours dropdown
            const destinationsResponse = await API.fetchDestinations();
            const destinations = destinationsResponse.data?.destinations || [];
            
            const toursSelect = document.querySelector('.service-form[data-form="tours"] select');
            if (toursSelect && destinations.length > 0) {
                toursSelect.innerHTML = '<option>Select destination...</option>' + 
                    destinations.map(d => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('');
            }
            
            // Load fleet for rentals dropdown
            const fleetResponse = await API.fetchFleet();
            const fleet = fleetResponse.data?.fleet || [];
            
            const rentalsSelect = document.querySelector('.service-form[data-form="rentals"] select');
            if (rentalsSelect && fleet.length > 0) {
                rentalsSelect.innerHTML = '<option>Select vehicle...</option>' + 
                    fleet.map(v => `<option value="${v.id}">${escapeHtml(v.vehicle_type)}</option>`).join('');
            }
        } catch (error) {
            console.error('Error populating booking widgets:', error);
            // Don't show error, just keep default options
        }
    }
    
    /**
     * Initialize landing page
     */
    async function init() {
        // Check if tables exist and initialize if needed
        try {
            const response = await fetch('database/check_landing_tables.php');
            const result = await response.json();
            console.log('Database check:', result);
        } catch (error) {
            console.error('Error checking database:', error);
        }
        
        // Load all content
        await Promise.all([
            loadDestinations(),
            loadFleet(),
            loadServices(),
            loadHeroStats(),
            populateBookingWidgets()
        ]);
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Export functions for external use if needed
    window.LandingPage = {
        loadDestinations,
        loadFleet,
        loadServices,
        loadHeroStats,
        populateBookingWidgets,
        init
    };
})();

