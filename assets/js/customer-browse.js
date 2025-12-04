/**
 * Customer Browse Tours - UI Controller
 * Handles tour browsing, filtering, sorting, and booking
 */

const CustomerBrowse = (() => {
    // =========================================
    // STATE MANAGEMENT
    // =========================================
    
    let state = {
        user: null,
        customer: null,
        tours: [],              // All tours from API
        filteredTours: [],      // Tours after filtering
        displayTours: [],       // Tours for current page/view
        destinations: [],       // Unique destinations for filter
        filters: {
            search: '',
            destinations: [],
            priceMin: null,
            priceMax: null,
            dateFrom: null,
            dateTo: null,
            duration: [],
            capacityMin: null,
            capacityMax: null
        },
        sortBy: 'date_asc',
        viewMode: 'grid',       // 'grid' or 'list'
        pagination: {
            currentPage: 1,
            itemsPerPage: 12,
            totalPages: 1,
            totalItems: 0
        },
        isLoading: false,
        currentTourId: null
    };
    
    // =========================================
    // DOM ELEMENTS
    // =========================================
    
    const elements = {
        // User info
        userEmail: document.getElementById('userEmail'),
        logoutBtn: document.getElementById('logoutBtn'),
        viewProfileBtn: document.getElementById('viewProfileBtn'),
        
        // Search
        searchInput: document.getElementById('searchInput'),
        searchClearBtn: document.getElementById('searchClearBtn'),
        
        // Filters
        filterSidebar: document.getElementById('filterSidebar'),
        mobileFilterToggle: document.getElementById('mobileFilterToggle'),
        clearAllFiltersBtn: document.getElementById('clearAllFiltersBtn'),
        destinationFilter: document.getElementById('destinationFilter'),
        priceMin: document.getElementById('priceMin'),
        priceMax: document.getElementById('priceMax'),
        priceRangeDisplay: document.getElementById('priceRangeDisplay'),
        dateFrom: document.getElementById('dateFrom'),
        dateTo: document.getElementById('dateTo'),
        durationFilter: document.getElementById('durationFilter'),
        capacityMin: document.getElementById('capacityMin'),
        capacityMax: document.getElementById('capacityMax'),
        activeFiltersChips: document.getElementById('activeFiltersChips'),
        
        // View toggle
        viewModeToggle: document.getElementById('viewModeToggle'),
        viewModeIcon: document.getElementById('viewModeIcon'),
        
        // Sort
        sortSelect: document.getElementById('sortSelect'),
        
        // Results
        resultsCount: document.getElementById('resultsCount'),
        toursContainer: document.getElementById('toursContainer'),
        
        // States
        loadingState: document.getElementById('loadingState'),
        errorState: document.getElementById('errorState'),
        emptyState: document.getElementById('emptyState'),
        retryBtn: document.getElementById('retryBtn'),
        clearFiltersEmptyBtn: document.getElementById('clearFiltersEmptyBtn'),
        
        // Pagination
        paginationContainer: document.getElementById('paginationContainer'),
        paginationInfo: document.getElementById('paginationInfo'),
        prevPageBtn: document.getElementById('prevPageBtn'),
        nextPageBtn: document.getElementById('nextPageBtn'),
        pageNumbers: document.getElementById('pageNumbers'),
        
        // Modals
        tourDetailModal: document.getElementById('tourDetailModal'),
        tourDetailModalLabel: document.getElementById('tourDetailModalLabel'),
        tourDetailModalBody: document.getElementById('tourDetailModalBody'),
        tourDetailBookBtn: document.getElementById('tourDetailBookBtn'),
        bookingModal: document.getElementById('bookingModal'),
        bookingModalLabel: document.getElementById('bookingModalLabel'),
        bookingForm: document.getElementById('bookingForm'),
        bookingId: document.getElementById('bookingId'),
        tourSelect: document.getElementById('tourSelect'),
        bookingDate: document.getElementById('bookingDate'),
        numGuests: document.getElementById('numGuests'),
        bookingNotes: document.getElementById('bookingNotes'),
        totalAmountDisplay: document.getElementById('totalAmountDisplay'),
        saveBookingBtn: document.getElementById('saveBookingBtn'),
        profileModal: document.getElementById('profileModal'),
        profileForm: document.getElementById('profileForm'),
        customerId: document.getElementById('customerId'),
        customerFirstName: document.getElementById('customerFirstName'),
        customerLastName: document.getElementById('customerLastName'),
        customerEmail: document.getElementById('customerEmail'),
        customerPhone: document.getElementById('customerPhone'),
        customerAddress: document.getElementById('customerAddress'),
        saveProfileBtn: document.getElementById('saveProfileBtn'),
        
        // Toast
        toastContainer: document.getElementById('toastContainer')
    };
    
    // Bootstrap modal instances
    let tourDetailModalInstance = null;
    let bookingModalInstance = null;
    let profileModalInstance = null;
    
    // =========================================
    // INITIALIZATION
    // =========================================
    
    /**
     * Initialize the browse page
     */
    async function init() {
        console.log('Customer Browse initializing...');
        
        // Check authentication
        await checkAuthAndRedirect();
        
        // Initialize Bootstrap modals
        tourDetailModalInstance = new bootstrap.Modal(elements.tourDetailModal);
        bookingModalInstance = new bootstrap.Modal(elements.bookingModal);
        profileModalInstance = new bootstrap.Modal(elements.profileModal);
        
        // Load view mode preference
        const savedViewMode = localStorage.getItem('browseViewMode');
        if (savedViewMode && (savedViewMode === 'grid' || savedViewMode === 'list')) {
            state.viewMode = savedViewMode;
        }
        
        // Initialize view mode UI
        if (elements.viewModeIcon) {
            elements.viewModeIcon.className = state.viewMode === 'grid' 
                ? 'bi bi-grid-3x3-gap' 
                : 'bi bi-list-ul';
        }
        if (elements.toursContainer) {
            elements.toursContainer.className = `tours-container ${state.viewMode}-view`;
        }
        
        // Setup event listeners
        setupEventListeners();
        
        // Load initial data
        await loadTours();
        
        console.log('Customer Browse initialized successfully');
    }
    
    /**
     * Check authentication and redirect if needed
     */
    async function checkAuthAndRedirect() {
        try {
            const response = await API.getCurrentUser();
            if (!response.success || !response.data) {
                window.location.href = 'landing.html';
                return;
            }
            
            const user = response.data;
            
            if (user.user_type !== 'customer') {
                window.location.href = 'index.html';
                return;
            }
            
            state.user = user;
            elements.userEmail.textContent = user.email;
            
            // Load customer data
            await loadCustomerData();
            
        } catch (error) {
            console.error('Auth check error:', error);
            window.location.href = 'landing.html';
        }
    }
    
    /**
     * Load customer data
     */
    async function loadCustomerData() {
        try {
            const customers = await API.fetchCustomers();
            if (customers.success && customers.data.customers) {
                state.customer = customers.data.customers.find(
                    c => c.email === state.user.email
                );
            }
        } catch (error) {
            console.error('Failed to load customer data:', error);
        }
    }
    
    /**
     * Setup all event listeners
     */
    function setupEventListeners() {
        // Navigation
        elements.logoutBtn?.addEventListener('click', handleLogout);
        elements.viewProfileBtn?.addEventListener('click', () => showProfileModal());
        
        // Search
        elements.searchInput?.addEventListener('input', debounce(handleSearch, 300));
        elements.searchClearBtn?.addEventListener('click', clearSearch);
        
        // Filters
        elements.mobileFilterToggle?.addEventListener('click', toggleMobileFilters);
        elements.clearAllFiltersBtn?.addEventListener('click', clearFilters);
        
        // Close mobile filters when clicking outside
        document.addEventListener('click', (e) => {
            if (elements.filterSidebar && elements.filterSidebar.classList.contains('show')) {
                if (!elements.filterSidebar.contains(e.target) && 
                    elements.mobileFilterToggle && !elements.mobileFilterToggle.contains(e.target)) {
                    elements.filterSidebar.classList.remove('show');
                    if (elements.mobileFilterToggle) {
                        elements.mobileFilterToggle.innerHTML = '<i class="bi bi-funnel me-2"></i>Show Filters';
                    }
                }
            }
        });
        elements.priceMin?.addEventListener('input', debounce(handlePriceFilter, 300));
        elements.priceMax?.addEventListener('input', debounce(handlePriceFilter, 300));
        elements.dateFrom?.addEventListener('change', handleDateFilter);
        elements.dateTo?.addEventListener('change', handleDateFilter);
        elements.capacityMin?.addEventListener('input', debounce(handleCapacityFilter, 300));
        elements.capacityMax?.addEventListener('input', debounce(handleCapacityFilter, 300));
        
        // Duration checkboxes
        const durationCheckboxes = elements.durationFilter?.querySelectorAll('input[type="checkbox"]');
        durationCheckboxes?.forEach(checkbox => {
            checkbox.addEventListener('change', handleDurationFilter);
        });
        
        // View toggle
        elements.viewModeToggle?.addEventListener('click', toggleViewMode);
        
        // Sort
        elements.sortSelect?.addEventListener('change', handleSortChange);
        
        // Pagination
        elements.prevPageBtn?.addEventListener('click', () => goToPage(state.pagination.currentPage - 1));
        elements.nextPageBtn?.addEventListener('click', () => goToPage(state.pagination.currentPage + 1));
        
        // States
        elements.retryBtn?.addEventListener('click', loadTours);
        elements.clearFiltersEmptyBtn?.addEventListener('click', clearFilters);
        
        // Booking
        elements.saveBookingBtn?.addEventListener('click', handleBookingSubmit);
        elements.tourDetailBookBtn?.addEventListener('click', handleBookFromDetail);
        elements.numGuests?.addEventListener('input', calculateBookingTotal);
        
        // Profile
        elements.saveProfileBtn?.addEventListener('click', handleProfileSubmit);
        
        // Modal events
        elements.bookingModal?.addEventListener('hidden.bs.modal', resetBookingForm);
        elements.profileModal?.addEventListener('hidden.bs.modal', resetProfileForm);
    }
    
    // =========================================
    // DATA LOADING
    // =========================================
    
    /**
     * Load tours from API
     */
    async function loadTours() {
        try {
            setLoading(true);
            hideStates();
            
            const response = await API.fetchTours();
            
            if (!response.success || !response.data) {
                throw new Error('Failed to load tours');
            }
            
            state.tours = response.data.tours.filter(t => t.status === 'active');
            
            // Extract unique destinations
            const uniqueDestinations = [...new Set(state.tours.map(t => t.destination).filter(Boolean))];
            state.destinations = uniqueDestinations.sort();
            
            // Populate destination filter
            populateDestinationFilter();
            
            // Apply filters and render
            applyFilters();
            
        } catch (error) {
            console.error('Error loading tours:', error);
            showError();
        } finally {
            setLoading(false);
        }
    }
    
    /**
     * Populate destination filter checkboxes
     */
    function populateDestinationFilter() {
        if (!elements.destinationFilter) return;
        
        if (state.destinations.length === 0) {
            elements.destinationFilter.innerHTML = '<div class="text-muted small">No destinations available</div>';
            return;
        }
        
        const html = state.destinations.map(dest => `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" 
                       id="dest-${escapeHtml(dest)}" 
                       value="${escapeHtml(dest)}"
                       data-destination="${escapeHtml(dest)}">
                <label class="form-check-label" for="dest-${escapeHtml(dest)}">
                    ${escapeHtml(dest)}
                </label>
            </div>
        `).join('');
        
        elements.destinationFilter.innerHTML = html;
        
        // Add event listeners
        elements.destinationFilter.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', handleDestinationFilter);
        });
    }
    
    // =========================================
    // FILTERING LOGIC
    // =========================================
    
    /**
     * Apply all filters to tours
     */
    function applyFilters() {
        let filtered = [...state.tours];
        
        // Search filter
        if (state.filters.search) {
            const searchLower = state.filters.search.toLowerCase();
            filtered = filtered.filter(tour => {
                const destMatch = tour.destination?.toLowerCase().includes(searchLower);
                const descMatch = tour.description?.toLowerCase().includes(searchLower);
                return destMatch || descMatch;
            });
        }
        
        // Destination filter
        if (state.filters.destinations.length > 0) {
            filtered = filtered.filter(tour => 
                state.filters.destinations.includes(tour.destination)
            );
        }
        
        // Price filter
        if (state.filters.priceMin !== null) {
            filtered = filtered.filter(tour => parseFloat(tour.price) >= state.filters.priceMin);
        }
        if (state.filters.priceMax !== null) {
            filtered = filtered.filter(tour => parseFloat(tour.price) <= state.filters.priceMax);
        }
        
        // Date filter
        if (state.filters.dateFrom) {
            filtered = filtered.filter(tour => {
                const tourStart = new Date(tour.start_date);
                const filterFrom = new Date(state.filters.dateFrom);
                return tourStart >= filterFrom;
            });
        }
        if (state.filters.dateTo) {
            filtered = filtered.filter(tour => {
                const tourStart = new Date(tour.start_date);
                const filterTo = new Date(state.filters.dateTo);
                return tourStart <= filterTo;
            });
        }
        
        // Duration filter
        if (state.filters.duration.length > 0) {
            filtered = filtered.filter(tour => {
                const start = new Date(tour.start_date);
                const end = new Date(tour.end_date);
                const durationHours = (end - start) / (1000 * 60 * 60);
                
                if (state.filters.duration.includes('half') && durationHours < 8) return true;
                if (state.filters.duration.includes('full') && durationHours >= 8 && durationHours <= 24) return true;
                if (state.filters.duration.includes('multi') && durationHours > 24) return true;
                
                return false;
            });
        }
        
        // Capacity filter
        if (state.filters.capacityMin !== null) {
            filtered = filtered.filter(tour => tour.capacity >= state.filters.capacityMin);
        }
        if (state.filters.capacityMax !== null) {
            filtered = filtered.filter(tour => tour.capacity <= state.filters.capacityMax);
        }
        
        state.filteredTours = filtered;
        
        // Apply sorting
        applySort();
        
        // Update pagination
        updatePagination();
        
        // Render
        renderTours();
        updateActiveFilters();
        updateResultsCount();
    }
    
    /**
     * Apply sorting to filtered tours
     */
    function applySort() {
        const tours = [...state.filteredTours];
        
        switch (state.sortBy) {
            case 'price_asc':
                tours.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                break;
            case 'price_desc':
                tours.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
                break;
            case 'date_asc':
                tours.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
                break;
            case 'date_desc':
                tours.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
                break;
            case 'popularity':
                // For now, sort by date (can be enhanced with booking count later)
                tours.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
                break;
            default:
                tours.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
        }
        
        state.filteredTours = tours;
    }
    
    // =========================================
    // FILTER HANDLERS
    // =========================================
    
    /**
     * Handle search input
     */
    function handleSearch() {
        state.filters.search = elements.searchInput.value.trim();
        
        if (state.filters.search) {
            elements.searchClearBtn.classList.remove('d-none');
        } else {
            elements.searchClearBtn.classList.add('d-none');
        }
        
        state.pagination.currentPage = 1;
        applyFilters();
    }
    
    /**
     * Clear search
     */
    function clearSearch() {
        elements.searchInput.value = '';
        state.filters.search = '';
        elements.searchClearBtn.classList.add('d-none');
        state.pagination.currentPage = 1;
        applyFilters();
    }
    
    /**
     * Handle destination filter change
     */
    function handleDestinationFilter() {
        const checkboxes = elements.destinationFilter.querySelectorAll('input[type="checkbox"]:checked');
        state.filters.destinations = Array.from(checkboxes).map(cb => cb.value);
        state.pagination.currentPage = 1;
        applyFilters();
    }
    
    /**
     * Handle price filter change
     */
    function handlePriceFilter() {
        const min = elements.priceMin.value ? parseFloat(elements.priceMin.value) : null;
        const max = elements.priceMax.value ? parseFloat(elements.priceMax.value) : null;
        
        state.filters.priceMin = min;
        state.filters.priceMax = max;
        
        // Update display
        const minDisplay = min !== null ? formatCurrency(min) : '$0';
        const maxDisplay = max !== null ? formatCurrency(max) : '∞';
        elements.priceRangeDisplay.textContent = `${minDisplay} - ${maxDisplay}`;
        
        state.pagination.currentPage = 1;
        applyFilters();
    }
    
    /**
     * Handle date filter change
     */
    function handleDateFilter() {
        state.filters.dateFrom = elements.dateFrom.value || null;
        state.filters.dateTo = elements.dateTo.value || null;
        state.pagination.currentPage = 1;
        applyFilters();
    }
    
    /**
     * Handle duration filter change
     */
    function handleDurationFilter() {
        const checkboxes = elements.durationFilter.querySelectorAll('input[type="checkbox"]:checked');
        state.filters.duration = Array.from(checkboxes).map(cb => cb.value);
        state.pagination.currentPage = 1;
        applyFilters();
    }
    
    /**
     * Handle capacity filter change
     */
    function handleCapacityFilter() {
        const min = elements.capacityMin.value ? parseInt(elements.capacityMin.value) : null;
        const max = elements.capacityMax.value ? parseInt(elements.capacityMax.value) : null;
        
        state.filters.capacityMin = min;
        state.filters.capacityMax = max;
        
        state.pagination.currentPage = 1;
        applyFilters();
    }
    
    /**
     * Clear all filters
     */
    function clearFilters() {
        // Reset filter state
        state.filters = {
            search: '',
            destinations: [],
            priceMin: null,
            priceMax: null,
            dateFrom: null,
            dateTo: null,
            duration: [],
            capacityMin: null,
            capacityMax: null
        };
        
        // Reset UI
        elements.searchInput.value = '';
        elements.searchClearBtn.classList.add('d-none');
        elements.priceMin.value = '';
        elements.priceMax.value = '';
        elements.priceRangeDisplay.textContent = '$0 - $∞';
        elements.dateFrom.value = '';
        elements.dateTo.value = '';
        elements.capacityMin.value = '';
        elements.capacityMax.value = '';
        
        // Uncheck all checkboxes
        elements.destinationFilter?.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        elements.durationFilter?.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        
        state.pagination.currentPage = 1;
        applyFilters();
    }
    
    /**
     * Update active filters display
     */
    function updateActiveFilters() {
        if (!elements.activeFiltersChips) return;
        
        const chips = [];
        
        if (state.filters.search) {
            chips.push({ type: 'search', label: `Search: "${state.filters.search}"`, value: 'search' });
        }
        
        state.filters.destinations.forEach(dest => {
            chips.push({ type: 'destination', label: dest, value: dest });
        });
        
        if (state.filters.priceMin !== null || state.filters.priceMax !== null) {
            const min = state.filters.priceMin !== null ? formatCurrency(state.filters.priceMin) : '$0';
            const max = state.filters.priceMax !== null ? formatCurrency(state.filters.priceMax) : '∞';
            chips.push({ type: 'price', label: `Price: ${min} - ${max}`, value: 'price' });
        }
        
        if (state.filters.dateFrom || state.filters.dateTo) {
            const from = state.filters.dateFrom || 'Any';
            const to = state.filters.dateTo || 'Any';
            chips.push({ type: 'date', label: `Dates: ${from} to ${to}`, value: 'date' });
        }
        
        state.filters.duration.forEach(dur => {
            const labels = { half: 'Half Day', full: 'Full Day', multi: 'Multi-day' };
            chips.push({ type: 'duration', label: labels[dur], value: dur });
        });
        
        if (state.filters.capacityMin !== null || state.filters.capacityMax !== null) {
            const min = state.filters.capacityMin !== null ? state.filters.capacityMin : '1';
            const max = state.filters.capacityMax !== null ? state.filters.capacityMax : '∞';
            chips.push({ type: 'capacity', label: `Capacity: ${min} - ${max}`, value: 'capacity' });
        }
        
        if (chips.length === 0) {
            elements.activeFiltersChips.innerHTML = '';
            elements.clearAllFiltersBtn.style.display = 'none';
            return;
        }
        
        elements.clearAllFiltersBtn.style.display = 'block';
        
        const html = chips.map(chip => `
            <span class="filter-chip">
                ${escapeHtml(chip.label)}
                <button type="button" class="chip-remove" data-filter-type="${chip.type}" data-filter-value="${escapeHtml(chip.value)}">
                    <i class="bi bi-x"></i>
                </button>
            </span>
        `).join('');
        
        elements.activeFiltersChips.innerHTML = html;
        
        // Add remove handlers
        elements.activeFiltersChips.querySelectorAll('.chip-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.filterType;
                const value = e.currentTarget.dataset.filterValue;
                removeFilter(type, value);
            });
        });
    }
    
    /**
     * Remove a specific filter
     */
    function removeFilter(type, value) {
        switch (type) {
            case 'search':
                clearSearch();
                break;
            case 'destination':
                const destCheckbox = elements.destinationFilter?.querySelector(`input[value="${value}"]`);
                if (destCheckbox) destCheckbox.checked = false;
                handleDestinationFilter();
                break;
            case 'price':
                elements.priceMin.value = '';
                elements.priceMax.value = '';
                handlePriceFilter();
                break;
            case 'date':
                elements.dateFrom.value = '';
                elements.dateTo.value = '';
                handleDateFilter();
                break;
            case 'duration':
                const durCheckbox = elements.durationFilter?.querySelector(`input[value="${value}"]`);
                if (durCheckbox) durCheckbox.checked = false;
                handleDurationFilter();
                break;
            case 'capacity':
                elements.capacityMin.value = '';
                elements.capacityMax.value = '';
                handleCapacityFilter();
                break;
        }
    }
    
    // =========================================
    // SORTING
    // =========================================
    
    /**
     * Handle sort change
     */
    function handleSortChange() {
        state.sortBy = elements.sortSelect.value;
        applySort();
        renderTours();
    }
    
    // =========================================
    // VIEW MODE
    // =========================================
    
    /**
     * Toggle between grid and list view
     */
    function toggleViewMode() {
        state.viewMode = state.viewMode === 'grid' ? 'list' : 'grid';
        localStorage.setItem('browseViewMode', state.viewMode);
        
        // Update icon
        if (elements.viewModeIcon) {
            elements.viewModeIcon.className = state.viewMode === 'grid' 
                ? 'bi bi-grid-3x3-gap' 
                : 'bi bi-list-ul';
        }
        
        // Update container class
        if (elements.toursContainer) {
            elements.toursContainer.className = `tours-container ${state.viewMode}-view`;
        }
        
        renderTours();
    }
    
    // =========================================
    // RENDERING
    // =========================================
    
    /**
     * Render tours
     */
    function renderTours() {
        if (!elements.toursContainer) return;
        
        // Get tours for current page
        const startIndex = (state.pagination.currentPage - 1) * state.pagination.itemsPerPage;
        const endIndex = startIndex + state.pagination.itemsPerPage;
        state.displayTours = state.filteredTours.slice(startIndex, endIndex);
        
        if (state.displayTours.length === 0) {
            showEmpty();
            return;
        }
        
        hideStates();
        
        const html = state.displayTours.map((tour, index) => renderTourCard(tour, index)).join('');
        elements.toursContainer.innerHTML = html;
        
        // Add click handlers
        elements.toursContainer.querySelectorAll('.tour-card').forEach(card => {
            const tourId = parseInt(card.dataset.tourId);
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on buttons
                if (e.target.closest('.btn')) return;
                showTourDetails(tourId);
            });
        });
        
        // Add book now handlers
        elements.toursContainer.querySelectorAll('.book-now-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const tourId = parseInt(btn.dataset.tourId);
                handleBookNow(tourId);
            });
        });
    }
    
    /**
     * Render a single tour card
     */
    function renderTourCard(tour, index) {
        const imageStyle = tour.image_url 
            ? `background-image: url('${escapeHtml(tour.image_url)}');`
            : `background: linear-gradient(135deg, var(--ocean-teal), var(--soft-teal));`;
        
        const startDate = new Date(tour.start_date);
        const endDate = new Date(tour.end_date);
        const durationHours = (endDate - startDate) / (1000 * 60 * 60);
        const durationDays = Math.ceil(durationHours / 24);
        
        const isListView = state.viewMode === 'list';
        const listClass = isListView ? 'list-view-card' : '';
        
        return `
            <div class="tour-card ${listClass}" data-tour-id="${tour.id}" style="animation-delay: ${index * 0.05}s">
                <div class="tour-card-image" style="${imageStyle}">
                    ${durationDays > 1 ? `<span class="tour-card-badge">${durationDays} Days</span>` : ''}
                </div>
                <div class="tour-card-body">
                    <h5 class="tour-card-title">${escapeHtml(tour.destination || 'Tour')}</h5>
                    <p class="tour-card-description">${escapeHtml((tour.description || '').substring(0, 120))}${tour.description && tour.description.length > 120 ? '...' : ''}</p>
                    <div class="tour-card-info">
                        <div class="tour-card-info-item">
                            <i class="bi bi-calendar3"></i>
                            <span>${formatDate(tour.start_date)}</span>
                        </div>
                        <div class="tour-card-info-item">
                            <i class="bi bi-clock"></i>
                            <span>${durationDays > 1 ? `${durationDays} days` : `${Math.round(durationHours)} hours`}</span>
                        </div>
                        <div class="tour-card-info-item">
                            <i class="bi bi-people"></i>
                            <span>Up to ${tour.capacity}</span>
                        </div>
                    </div>
                    <div class="tour-card-footer">
                        <div class="tour-card-price">
                            <span class="price-amount">${formatCurrency(tour.price)}</span>
                            <span class="price-label">per person</span>
                        </div>
                        <div class="tour-card-actions">
                            <button class="btn btn-primary-gradient btn-sm book-now-btn" data-tour-id="${tour.id}">
                                <i class="bi bi-calendar-plus me-1"></i>Book Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Update results count
     */
    function updateResultsCount() {
        if (!elements.resultsCount) return;
        
        const total = state.filteredTours.length;
        const start = total === 0 ? 0 : (state.pagination.currentPage - 1) * state.pagination.itemsPerPage + 1;
        const end = Math.min(start + state.pagination.itemsPerPage - 1, total);
        
        if (total === 0) {
            elements.resultsCount.textContent = 'No tours found';
        } else {
            elements.resultsCount.textContent = `Showing ${start}-${end} of ${total} tours`;
        }
    }
    
    // =========================================
    // PAGINATION
    // =========================================
    
    /**
     * Update pagination
     */
    function updatePagination() {
        state.pagination.totalItems = state.filteredTours.length;
        state.pagination.totalPages = Math.ceil(state.pagination.totalItems / state.pagination.itemsPerPage);
        
        renderPagination();
    }
    
    /**
     * Render pagination controls
     */
    function renderPagination() {
        if (!elements.paginationContainer) return;
        
        if (state.pagination.totalPages <= 1) {
            elements.paginationContainer.classList.add('d-none');
            return;
        }
        
        elements.paginationContainer.classList.remove('d-none');
        
        // Update info
        const start = (state.pagination.currentPage - 1) * state.pagination.itemsPerPage + 1;
        const end = Math.min(start + state.pagination.itemsPerPage - 1, state.pagination.totalItems);
        elements.paginationInfo.textContent = `Showing ${start}-${end} of ${state.pagination.totalItems} tours`;
        
        // Update buttons
        elements.prevPageBtn.disabled = state.pagination.currentPage === 1;
        elements.nextPageBtn.disabled = state.pagination.currentPage === state.pagination.totalPages;
        
        // Render page numbers
        const pageNumbers = [];
        const maxPages = 5;
        let startPage = Math.max(1, state.pagination.currentPage - Math.floor(maxPages / 2));
        let endPage = Math.min(state.pagination.totalPages, startPage + maxPages - 1);
        
        if (endPage - startPage < maxPages - 1) {
            startPage = Math.max(1, endPage - maxPages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(`
                <button class="page-number ${i === state.pagination.currentPage ? 'active' : ''}" 
                        onclick="CustomerBrowse.goToPage(${i})">
                    ${i}
                </button>
            `);
        }
        
        elements.pageNumbers.innerHTML = pageNumbers.join('');
    }
    
    /**
     * Go to specific page
     */
    function goToPage(page) {
        if (page >= 1 && page <= state.pagination.totalPages) {
            state.pagination.currentPage = page;
            renderTours();
            renderPagination();
            updateResultsCount();
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
    
    // =========================================
    // TOUR DETAILS
    // =========================================
    
    /**
     * Show tour details modal
     */
    function showTourDetails(tourId) {
        const tour = state.tours.find(t => t.id === tourId);
        if (!tour) return;
        
        state.currentTourId = tourId;
        
        const startDate = new Date(tour.start_date);
        const endDate = new Date(tour.end_date);
        const durationHours = (endDate - startDate) / (1000 * 60 * 60);
        const durationDays = Math.ceil(durationHours / 24);
        
        elements.tourDetailModalLabel.innerHTML = `<i class="bi bi-info-circle me-2"></i>${escapeHtml(tour.destination || 'Tour Details')}`;
        
        const imageHtml = tour.image_url 
            ? `<img src="${escapeHtml(tour.image_url)}" alt="${escapeHtml(tour.destination)}" class="img-fluid rounded mb-3" style="max-height: 300px; width: 100%; object-fit: cover;">`
            : `<div class="rounded mb-3 d-flex align-items-center justify-content-center" style="height: 200px; background: linear-gradient(135deg, var(--ocean-teal), var(--soft-teal));">
                <i class="bi bi-image text-white" style="font-size: 3rem;"></i>
               </div>`;
        
        elements.tourDetailModalBody.innerHTML = `
            ${imageHtml}
            <div class="mb-3">
                <h4>${escapeHtml(tour.destination || 'Tour')}</h4>
                <p class="text-muted">${escapeHtml(tour.description || 'No description available.')}</p>
            </div>
            <div class="row g-3 mb-3">
                <div class="col-md-6">
                    <div class="destination-feature-card">
                        <div class="feature-icon">
                            <i class="bi bi-calendar3"></i>
                        </div>
                        <div class="feature-content">
                            <h6>Start Date</h6>
                            <p class="mb-0">${formatDate(tour.start_date)}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="destination-feature-card">
                        <div class="feature-icon">
                            <i class="bi bi-calendar-check"></i>
                        </div>
                        <div class="feature-content">
                            <h6>End Date</h6>
                            <p class="mb-0">${formatDate(tour.end_date)}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="destination-feature-card">
                        <div class="feature-icon">
                            <i class="bi bi-clock"></i>
                        </div>
                        <div class="feature-content">
                            <h6>Duration</h6>
                            <p class="mb-0">${durationDays > 1 ? `${durationDays} days` : `${Math.round(durationHours)} hours`}</p>
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
                            <p class="mb-0">${tour.capacity} people</p>
                        </div>
                    </div>
                </div>
                <div class="col-12">
                    <div class="alert alert-info">
                        <h5 class="mb-0">${formatCurrency(tour.price)} <small class="text-muted">per person</small></h5>
                    </div>
                </div>
            </div>
        `;
        
        tourDetailModalInstance.show();
    }
    
    // =========================================
    // BOOKING
    // =========================================
    
    /**
     * Handle Book Now click
     */
    function handleBookNow(tourId) {
        if (!state.customer) {
            showToast('Please update your profile first', 'error');
            return;
        }
        
        const tour = state.tours.find(t => t.id === tourId);
        if (!tour) {
            showToast('Tour not found', 'error');
            return;
        }
        
        state.currentTourId = tourId;
        elements.tourSelect.value = tourId;
        elements.bookingDate.value = new Date().toISOString().split('T')[0];
        elements.numGuests.value = 1;
        elements.bookingNotes.value = '';
        calculateBookingTotal();
        
        elements.bookingModalLabel.innerHTML = `<i class="bi bi-calendar-plus me-2"></i>Book: ${escapeHtml(tour.destination)}`;
        
        bookingModalInstance.show();
    }
    
    /**
     * Handle Book from detail modal
     */
    function handleBookFromDetail() {
        tourDetailModalInstance.hide();
        setTimeout(() => {
            if (state.currentTourId) {
                handleBookNow(state.currentTourId);
            }
        }, 300);
    }
    
    /**
     * Calculate booking total
     */
    function calculateBookingTotal() {
        if (!state.currentTourId) {
            elements.totalAmountDisplay.textContent = '0.00';
            return;
        }
        
        const tour = state.tours.find(t => t.id === state.currentTourId);
        if (!tour) {
            elements.totalAmountDisplay.textContent = '0.00';
            return;
        }
        
        const guests = parseInt(elements.numGuests.value) || 1;
        const total = (parseFloat(tour.price) * guests).toFixed(2);
        elements.totalAmountDisplay.textContent = total;
    }
    
    /**
     * Handle booking submission
     */
    async function handleBookingSubmit() {
        if (!elements.bookingForm.checkValidity()) {
            elements.bookingForm.reportValidity();
            return;
        }
        
        if (!state.customer || !state.currentTourId) {
            showToast('Missing required information', 'error');
            return;
        }
        
        const tour = state.tours.find(t => t.id === state.currentTourId);
        if (!tour) {
            showToast('Tour not found', 'error');
            return;
        }
        
        const data = {
            tour_id: state.currentTourId,
            customer_id: state.customer.id,
            booking_date: elements.bookingDate.value,
            num_guests: parseInt(elements.numGuests.value),
            status: 'pending',
            payment_status: 'unpaid',
            total_amount: parseFloat(elements.totalAmountDisplay.textContent),
            notes: elements.bookingNotes.value.trim()
        };
        
        try {
            elements.saveBookingBtn.disabled = true;
            elements.saveBookingBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating...';
            
            await API.createBooking(data);
            showToast('Booking created successfully', 'success');
            
            bookingModalInstance.hide();
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'customer-dashboard.html';
            }, 1500);
            
        } catch (error) {
            showToast(error.message || 'Failed to create booking', 'error');
            console.error('Booking creation error:', error);
        } finally {
            elements.saveBookingBtn.disabled = false;
            elements.saveBookingBtn.innerHTML = '<i class="bi bi-check-lg me-2"></i>Create Booking';
        }
    }
    
    /**
     * Reset booking form
     */
    function resetBookingForm() {
        state.currentTourId = null;
        elements.bookingForm.reset();
        elements.tourSelect.value = '';
        elements.totalAmountDisplay.textContent = '0.00';
        elements.numGuests.value = 1;
        elements.bookingDate.value = new Date().toISOString().split('T')[0];
    }
    
    // =========================================
    // PROFILE
    // =========================================
    
    /**
     * Show profile modal
     */
    async function showProfileModal() {
        if (!state.customer) {
            showToast('Customer profile not found', 'error');
            return;
        }
        
        elements.customerId.value = state.customer.id;
        elements.customerFirstName.value = state.customer.first_name || '';
        elements.customerLastName.value = state.customer.last_name || '';
        elements.customerEmail.value = state.customer.email || '';
        elements.customerPhone.value = state.customer.phone || '';
        elements.customerAddress.value = state.customer.address || '';
        
        profileModalInstance.show();
    }
    
    /**
     * Handle profile submission
     */
    async function handleProfileSubmit() {
        if (!elements.profileForm.checkValidity()) {
            elements.profileForm.reportValidity();
            return;
        }
        
        const data = {
            first_name: elements.customerFirstName.value.trim(),
            last_name: elements.customerLastName.value.trim(),
            email: elements.customerEmail.value.trim(),
            phone: elements.customerPhone.value.trim(),
            address: elements.customerAddress.value.trim()
        };
        
        try {
            elements.saveProfileBtn.disabled = true;
            elements.saveProfileBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';
            
            await API.updateCustomer(state.customer.id, data);
            showToast('Profile updated successfully', 'success');
            
            await loadCustomerData();
            profileModalInstance.hide();
            
        } catch (error) {
            showToast(error.message || 'Failed to update profile', 'error');
            console.error('Profile update error:', error);
        } finally {
            elements.saveProfileBtn.disabled = false;
            elements.saveProfileBtn.innerHTML = '<i class="bi bi-check-lg me-2"></i>Update Profile';
        }
    }
    
    /**
     * Reset profile form
     */
    function resetProfileForm() {
        // Form will be populated when modal opens
    }
    
    // =========================================
    // MOBILE FILTERS
    // =========================================
    
    /**
     * Toggle mobile filters
     */
    function toggleMobileFilters() {
        elements.filterSidebar.classList.toggle('show');
        const isOpen = elements.filterSidebar.classList.contains('show');
        elements.mobileFilterToggle.innerHTML = isOpen 
            ? '<i class="bi bi-x-lg me-2"></i>Close Filters'
            : '<i class="bi bi-funnel me-2"></i>Show Filters';
    }
    
    // =========================================
    // UI STATES
    // =========================================
    
    /**
     * Set loading state
     */
    function setLoading(loading) {
        state.isLoading = loading;
        if (loading) {
            elements.loadingState?.classList.remove('d-none');
        } else {
            elements.loadingState?.classList.add('d-none');
        }
    }
    
    /**
     * Show error state
     */
    function showError() {
        elements.errorState?.classList.remove('d-none');
        elements.toursContainer.innerHTML = '';
    }
    
    /**
     * Show empty state
     */
    function showEmpty() {
        elements.emptyState?.classList.remove('d-none');
        elements.toursContainer.innerHTML = '';
    }
    
    /**
     * Hide all states
     */
    function hideStates() {
        elements.loadingState?.classList.add('d-none');
        elements.errorState?.classList.add('d-none');
        elements.emptyState?.classList.add('d-none');
    }
    
    // =========================================
    // UTILITY FUNCTIONS
    // =========================================
    
    /**
     * Format currency
     */
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount || 0);
    }
    
    /**
     * Format date
     */
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    
    /**
     * Escape HTML
     */
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Show toast notification
     */
    function showToast(message, type = 'info') {
        const toastId = 'toast-' + Date.now();
        const bgColor = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-info';
        
        const toastHTML = `
            <div id="${toastId}" class="toast ${bgColor} text-white" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-body">
                    ${escapeHtml(message)}
                </div>
            </div>
        `;
        
        elements.toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
        toast.show();
        
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
    
    /**
     * Debounce function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * Handle logout
     */
    async function handleLogout() {
        try {
            await API.logout();
            window.location.href = 'landing.html';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = 'landing.html';
        }
    }
    
    // =========================================
    // PUBLIC API
    // =========================================
    
    return {
        init,
        goToPage
    };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        CustomerBrowse.init();
    });
} else {
    CustomerBrowse.init();
}

