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
                        <button type="button" class="btn btn-outline-tropical" onclick="event.preventDefault(); event.stopPropagation(); LandingPage.exploreDestination(${destination.id}); return false;">
                            Explore
                        </button>
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
     * Populate booking widget dropdowns
     */
    async function populateBookingWidgets() {
        try {
            // Load tours for tours dropdown
            const toursResponse = await API.fetchTours();
            const tours = toursResponse.data?.tours || [];
            
            const toursSelect = document.getElementById('tourSelect');
            if (toursSelect && tours.length > 0) {
                toursSelect.innerHTML = '<option value="">Select destination...</option>' + 
                    tours.map(tour => `<option value="${tour.id}" data-price="${tour.price}">${escapeHtml(tour.destination)} - $${parseFloat(tour.price).toFixed(2)}</option>`).join('');
                
                // Add change listener for price calculation
                toursSelect.addEventListener('change', calculateTourPrice);
            }
            
            // Load fleet for rentals dropdown
            const fleetResponse = await API.fetchFleet();
            const fleet = fleetResponse.data?.fleet || [];
            
            const rentalsSelect = document.querySelector('.service-form[data-form="rentals"] select');
            if (rentalsSelect && fleet.length > 0) {
                rentalsSelect.innerHTML = '<option>Select vehicle...</option>' + 
                    fleet.map(v => `<option value="${v.id}">${escapeHtml(v.vehicle_type)}</option>`).join('');
            }
            
            // Set minimum date to today for tour date
            const tourDateInput = document.getElementById('tourDate');
            if (tourDateInput) {
                const today = new Date().toISOString().split('T')[0];
                tourDateInput.setAttribute('min', today);
                tourDateInput.addEventListener('change', calculateTourPrice);
            }
            
            // Add change listener for number of guests
            const numGuestsInput = document.getElementById('numGuests');
            if (numGuestsInput) {
                numGuestsInput.addEventListener('input', calculateTourPrice);
            }
            
            // Setup form submission handler
            setupAvailabilityCheck();
        } catch (error) {
            console.error('Error populating booking widgets:', error);
            // Don't show error, just keep default options
        }
    }
    
    /**
     * Calculate tour price in real-time
     */
    function calculateTourPrice() {
        const tourSelect = document.getElementById('tourSelect');
        const numGuestsInput = document.getElementById('numGuests');
        const pricePreview = document.getElementById('pricePreview');
        const priceAmount = document.getElementById('priceAmount');
        const priceBreakdown = document.getElementById('priceBreakdown');
        
        if (!tourSelect || !numGuestsInput || !pricePreview) return;
        
        const selectedOption = tourSelect.selectedOptions[0];
        const numGuests = parseInt(numGuestsInput.value) || 0;
        
        if (selectedOption && selectedOption.value && numGuests > 0) {
            const price = parseFloat(selectedOption.dataset.price) || 0;
            const total = price * numGuests;
            
            priceAmount.textContent = `$${total.toFixed(2)}`;
            priceBreakdown.textContent = `$${price.toFixed(2)} × ${numGuests} guest${numGuests > 1 ? 's' : ''}`;
            pricePreview.style.display = 'block';
        } else {
            pricePreview.style.display = 'none';
        }
    }
    
    /**
     * Setup availability check form handler
     */
    function setupAvailabilityCheck() {
        const bookingForm = document.getElementById('bookingForm');
        if (!bookingForm) return;
        
        // Reset modal when closed
        const availabilityModal = document.getElementById('availabilityModal');
        if (availabilityModal) {
            availabilityModal.addEventListener('hidden.bs.modal', function() {
                const loadingEl = document.getElementById('availabilityModalLoading');
                const resultEl = document.getElementById('availabilityModalResult');
                if (loadingEl) loadingEl.style.display = 'none';
                if (resultEl) {
                    resultEl.style.display = 'none';
                    resultEl.innerHTML = '';
                }
            });
        }
        
        bookingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get active service type
            const activeToggle = document.querySelector('.service-toggle.active');
            if (!activeToggle) return;
            
            const serviceType = activeToggle.dataset.service;
            
            // For Phase 1, only handle tours
            if (serviceType !== 'tours') {
                alert('Availability checking for ' + serviceType + ' will be available soon!');
                return;
            }
            
            // Get form values
            const tourSelect = document.getElementById('tourSelect');
            const tourDate = document.getElementById('tourDate');
            const numGuests = document.getElementById('numGuests');
            
            if (!tourSelect || !tourDate || !numGuests) return;
            
            // Validate form
            if (!tourSelect.value) {
                alert('Please select a destination');
                tourSelect.focus();
                return;
            }
            
            if (!tourDate.value) {
                alert('Please select a tour date');
                tourDate.focus();
                return;
            }
            
            const tourId = parseInt(tourSelect.value);
            const date = tourDate.value;
            const guests = parseInt(numGuests.value);
            
            if (guests < 1 || guests > 20) {
                alert('Number of guests must be between 1 and 20');
                numGuests.focus();
                return;
            }
            
            // Open modal and check availability
            await checkAvailability({
                service_type: 'tours',
                tour_id: tourId,
                date: date,
                num_guests: guests
            });
        });
    }
    
    /**
     * Check availability for selected service
     */
    async function checkAvailability(data) {
        const modal = document.getElementById('availabilityModal');
        const modalBody = document.getElementById('availabilityModalBody');
        const loadingEl = document.getElementById('availabilityModalLoading');
        const resultEl = document.getElementById('availabilityModalResult');
        const checkBtn = document.getElementById('checkAvailabilityBtn');
        
        if (!modal || !modalBody) return;
        
        // Initialize Bootstrap modal if not already done
        let modalInstance = bootstrap.Modal.getInstance(modal);
        if (!modalInstance) {
            modalInstance = new bootstrap.Modal(modal);
        }
        
        // Open modal
        modalInstance.show();
        
        // Show loading state, hide result
        if (loadingEl) loadingEl.style.display = 'block';
        if (resultEl) resultEl.style.display = 'none';
        if (checkBtn) {
            checkBtn.disabled = true;
            checkBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Checking...';
        }
        
        try {
            const response = await API.checkAvailability(data);
            
            if (!response.success) {
                throw new Error(response.error || 'Failed to check availability');
            }
            
            const result = response.data;
            displayAvailabilityResult(result);
            
        } catch (error) {
            console.error('Availability check error:', error);
            displayAvailabilityError(error.message || 'Failed to check availability. Please try again.');
        } finally {
            // Hide loading state
            if (loadingEl) loadingEl.style.display = 'none';
            if (checkBtn) {
                checkBtn.disabled = false;
                checkBtn.innerHTML = '<i class="bi bi-search me-2"></i>Check Availability';
            }
        }
    }
    
    /**
     * Display availability result in modal
     */
    function displayAvailabilityResult(result) {
        const resultEl = document.getElementById('availabilityModalResult');
        if (!resultEl) return;
        
        const { available, available_slots, requested_slots, total_price, tour, message } = result;
        
        // Determine result type
        let resultType = 'error';
        let iconClass = 'bi-x-circle-fill';
        let iconColor = '#E63946';
        
        if (available) {
            if (available_slots <= 3) {
                resultType = 'warning';
                iconClass = 'bi-exclamation-triangle-fill';
                iconColor = '#FF8C42';
            } else {
                resultType = 'success';
                iconClass = 'bi-check-circle-fill';
                iconColor = '#4ECDC4';
            }
        }
        
        // Build result HTML
        const resultHTML = `
            <div class="availability-result-modal text-center">
                <i class="bi ${iconClass}" style="font-size: 4rem; color: ${iconColor}; margin-bottom: 1rem;"></i>
                <h4 class="mb-3">${available ? (available_slots <= 3 ? 'Limited Availability' : 'Available!') : 'Not Available'}</h4>
                <p class="text-muted mb-4">${escapeHtml(message)}</p>
                ${available ? `
                    <div class="price-display-modal mb-4">
                        <div class="h2 mb-2" style="color: var(--deep-cyan); font-weight: var(--font-weight-extrabold);">
                            $${parseFloat(total_price).toFixed(2)}
                        </div>
                        <small class="text-muted">Total for ${requested_slots} guest${requested_slots > 1 ? 's' : ''}</small>
                    </div>
                    <div class="tour-info-card mb-4 p-3" style="background: rgba(0, 107, 125, 0.05); border-radius: 10px;">
                        <h5 class="mb-2">${escapeHtml(tour.destination)}</h5>
                        <p class="text-muted small mb-0">${escapeHtml(tour.description || '')}</p>
                    </div>
                    <div class="d-grid gap-2">
                        <a href="customer-browse.html" class="btn btn-primary-tropical">
                            <i class="bi bi-calendar-check me-2"></i>Proceed to Booking
                        </a>
                        <button class="btn btn-outline-tropical" data-bs-dismiss="modal">
                            Close
                        </button>
                    </div>
                ` : `
                    <div class="d-grid gap-2">
                        <a href="customer-browse.html" class="btn btn-outline-tropical">
                            <i class="bi bi-search me-2"></i>Browse Other Tours
                        </a>
                        <button class="btn btn-outline-tropical" data-bs-dismiss="modal">
                            Close
                        </button>
                    </div>
                `}
            </div>
        `;
        
        resultEl.innerHTML = resultHTML;
        resultEl.style.display = 'block';
    }
    
    /**
     * Display availability error in modal
     */
    function displayAvailabilityError(message) {
        const resultEl = document.getElementById('availabilityModalResult');
        if (!resultEl) return;
        
        const resultHTML = `
            <div class="availability-result-modal text-center">
                <i class="bi bi-exclamation-circle-fill" style="font-size: 4rem; color: #E63946; margin-bottom: 1rem;"></i>
                <h4 class="mb-3">Error</h4>
                <p class="text-muted mb-4">${escapeHtml(message)}</p>
                <div class="d-grid">
                    <button class="btn btn-outline-tropical" data-bs-dismiss="modal">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        resultEl.innerHTML = resultHTML;
        resultEl.style.display = 'block';
    }
    
    /**
     * Fetch related tours for a destination (backend filtering)
     * @param {number} destinationId - ID of the destination
     * @returns {Promise<Array>} Array of related tours
     */
    async function fetchRelatedTours(destinationId) {
        try {
            const response = await API.fetchDestinationTours(destinationId);
            const tours = response.data?.tours || [];
            
            // Backend handles all filtering - just return the tours
            return tours;
        } catch (error) {
            console.error('Error fetching related tours:', error);
            // Return empty array on error to gracefully handle failures
            return [];
        }
    }
    
    /**
     * Explore destination - Main handler for Explore button
     * @param {number} destinationId - ID of the destination
     */
    async function exploreDestination(destinationId) {
        const modal = document.getElementById('destinationDetailModal');
        const modalBody = document.getElementById('destinationModalBody');
        const loadingEl = document.getElementById('destinationModalLoading');
        const contentEl = document.getElementById('destinationModalContent');
        const errorEl = document.getElementById('destinationModalError');
        
        if (!modal) {
            console.error('Destination modal not found');
            return;
        }
        
        // Show loading state
        loadingEl.classList.remove('d-none');
        contentEl.classList.add('d-none');
        errorEl.classList.add('d-none');
        
        // Initialize Bootstrap modal if not already done
        let modalInstance = bootstrap.Modal.getInstance(modal);
        if (!modalInstance) {
            modalInstance = new bootstrap.Modal(modal);
        }
        
        // Open modal
        modalInstance.show();
        
        try {
            // Fetch destination details
            const destinationResponse = await API.fetchDestination(destinationId);
            
            if (!destinationResponse.success || !destinationResponse.data) {
                throw new Error('Destination not found');
            }
            
            const destination = destinationResponse.data;
            
            // Fetch related tours using destination ID (backend filtering)
            const relatedTours = await fetchRelatedTours(destination.id);
            
            // Render modal content
            renderDestinationModal(destination, relatedTours);
            
            // Hide loading, show content
            loadingEl.classList.add('d-none');
            contentEl.classList.remove('d-none');
            
        } catch (error) {
            console.error('Error loading destination:', error);
            
            // Show error state
            loadingEl.classList.add('d-none');
            contentEl.classList.add('d-none');
            errorEl.classList.remove('d-none');
        }
    }
    
    /**
     * Render destination modal content
     * @param {Object} destination - Destination data
     * @param {Array} relatedTours - Array of related tours
     */
    function renderDestinationModal(destination, relatedTours) {
        // Update modal title
        const titleEl = document.getElementById('destinationModalTitle');
        if (titleEl) {
            titleEl.textContent = destination.name || 'Destination Details';
        }
        
        // Render hero image
        const heroEl = document.getElementById('destinationModalHero');
        if (heroEl) {
            if (destination.image_url) {
                heroEl.innerHTML = `
                    <img src="${escapeHtml(destination.image_url)}" 
                         alt="${escapeHtml(destination.name)}" 
                         class="img-fluid rounded"
                         style="width: 100%; max-height: 400px; object-fit: cover;">
                `;
            } else {
                heroEl.innerHTML = `
                    <div class="destination-modal-hero-placeholder rounded d-flex align-items-center justify-content-center"
                         style="height: 300px; background: linear-gradient(135deg, var(--ocean-teal), var(--soft-teal));">
                        <i class="bi bi-geo-alt-fill text-white" style="font-size: 4rem;"></i>
                    </div>
                `;
            }
        }
        
        // Render description
        const descEl = document.getElementById('destinationModalDescription');
        if (descEl) {
            descEl.textContent = destination.description || 'No description available for this destination.';
        }
        
        // Render features
        const featuresEl = document.getElementById('destinationModalFeatures');
        if (featuresEl) {
            featuresEl.innerHTML = `
                <div class="col-md-6">
                    <div class="destination-feature-card">
                        <div class="feature-icon">
                            <i class="bi bi-clock"></i>
                        </div>
                        <div class="feature-content">
                            <h6>Duration</h6>
                            <p class="mb-0">${destination.duration_hours || 'N/A'} Hours</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="destination-feature-card">
                        <div class="feature-icon">
                            <i class="bi bi-people"></i>
                        </div>
                        <div class="feature-content">
                            <h6>Max Capacity</h6>
                            <p class="mb-0">Up to ${destination.max_capacity || 'N/A'} People</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Render related tours
        const toursEl = document.getElementById('destinationModalTours');
        const noToursEl = document.getElementById('destinationModalNoTours');
        const bookBtn = document.getElementById('destinationModalBookBtn');
        
        if (relatedTours && relatedTours.length > 0) {
            if (toursEl) {
                toursEl.innerHTML = relatedTours.map(tour => {
                    const tourPrice = parseFloat(tour.price || 0).toFixed(2);
                    return `
                        <div class="destination-tour-card mb-3">
                            <div class="row g-3 align-items-center">
                                <div class="col-md-8">
                                    <h6 class="mb-1">${escapeHtml(tour.destination || 'Tour')}</h6>
                                    <p class="text-muted small mb-2">${escapeHtml((tour.description || '').substring(0, 150))}${tour.description && tour.description.length > 150 ? '...' : ''}</p>
                                    <div class="d-flex gap-3 small text-muted">
                                        <span><i class="bi bi-calendar3"></i> ${tour.start_date ? new Date(tour.start_date).toLocaleDateString() : 'Flexible'}</span>
                                        <span><i class="bi bi-people"></i> ${tour.max_capacity || 'N/A'} guests</span>
                                    </div>
                                </div>
                                <div class="col-md-4 text-md-end">
                                    <div class="tour-price mb-2">
                                        <span class="h5 text-primary">$${tourPrice}</span>
                                        <small class="text-muted d-block">per person</small>
                                    </div>
                                    <button class="btn btn-primary-tropical btn-sm w-100" 
                                            onclick="LandingPage.handleBookTour(${tour.id})">
                                        <i class="bi bi-calendar-plus me-1"></i>Book Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
            
            if (noToursEl) {
                noToursEl.classList.add('d-none');
            }
            
            // Show book button if tours available
            if (bookBtn && relatedTours.length > 0) {
                bookBtn.style.display = 'inline-flex';
                bookBtn.href = '#hero';
            }
        } else {
            if (toursEl) {
                toursEl.innerHTML = '';
            }
            
            if (noToursEl) {
                noToursEl.classList.remove('d-none');
            }
            
            if (bookBtn) {
                bookBtn.style.display = 'none';
            }
        }
    }
    
    /**
     * Handle book tour action from modal
     * @param {number} tourId - ID of the tour to book
     */
    function handleBookTour(tourId) {
        // Close the destination modal
        const modal = document.getElementById('destinationDetailModal');
        if (modal) {
            const modalInstance = bootstrap.Modal.getInstance(modal);
            if (modalInstance) {
                modalInstance.hide();
            }
        }
        
        // Scroll to booking widget
        const heroSection = document.getElementById('hero');
        if (heroSection) {
            heroSection.scrollIntoView({ behavior: 'smooth' });
            
            // After scroll, switch to tours tab and pre-select the tour
            setTimeout(() => {
                // Switch to tours service
                const toursToggle = document.querySelector('.service-toggle[data-service="tours"]');
                if (toursToggle) {
                    toursToggle.click();
                }
                
                // Pre-select the tour in the dropdown (if possible)
                const toursSelect = document.querySelector('.service-form[data-form="tours"] select');
                if (toursSelect) {
                    toursSelect.value = tourId;
                    toursSelect.dispatchEvent(new Event('change'));
                }
            }, 500);
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
        exploreDestination,
        handleBookTour,
        checkAvailability,
        calculateTourPrice,
        init
    };
})();

