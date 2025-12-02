/**
 * RTS Dashboard - UI Controller
 * Handles DOM manipulation, event handling, and state management
 * Provides a seamless, no-reload user experience
 */

const App = (() => {
    // =========================================
    // STATE MANAGEMENT
    // =========================================
    
    let state = {
        bookings: [],
        tours: [],
        customers: [],
        services: [],
        destinations: [],
        fleet: [],
        stats: null,
        filters: {
            status: '',
            search: ''
        },
        pagination: {
            currentPage: 1,
            itemsPerPage: 10,
            totalPages: 1,
            totalItems: 0
        },
        currentBookingId: null,
        currentTourId: null,
        currentCustomerId: null,
        currentServiceId: null,
        currentDestinationId: null,
        currentFleetId: null,
        currentManagementType: null, // 'services', 'destinations', 'fleet'
        isLoading: false
    };
    
    // =========================================
    // DOM ELEMENTS
    // =========================================
    
    const elements = {
        // Stats
        statTotalBookings: document.getElementById('statTotalBookings'),
        statPending: document.getElementById('statPending'),
        statConfirmed: document.getElementById('statConfirmed'),
        statRevenue: document.getElementById('statRevenue'),
        statActiveTours: document.getElementById('statActiveTours'),
        statCustomers: document.getElementById('statCustomers'),
        statRecentBookings: document.getElementById('statRecentBookings'),
        statCollected: document.getElementById('statCollected'),
        
        // Table
        bookingsTableBody: document.getElementById('bookingsTableBody'),
        tableLoading: document.getElementById('tableLoading'),
        emptyState: document.getElementById('emptyState'),
        
        // Pagination
        paginationContainer: document.getElementById('paginationContainer'),
        paginationInfo: document.getElementById('paginationInfo'),
        prevPageBtn: document.getElementById('prevPageBtn'),
        nextPageBtn: document.getElementById('nextPageBtn'),
        pageNumbers: document.getElementById('pageNumbers'),
        
        // Filters
        searchInput: document.getElementById('searchInput'),
        statusFilter: document.getElementById('statusFilter'),
        
        // Sidebar
        upcomingTours: document.getElementById('upcomingTours'),
        customersList: document.getElementById('customersList'),
        
        // Buttons
        newBookingBtn: document.getElementById('newBookingBtn'),
        newTourBtn: document.getElementById('newTourBtn'),
        newCustomerBtn: document.getElementById('newCustomerBtn'),
        refreshBtn: document.getElementById('refreshBtn'),
        saveBookingBtn: document.getElementById('saveBookingBtn'),
        saveTourBtn: document.getElementById('saveTourBtn'),
        saveCustomerBtn: document.getElementById('saveCustomerBtn'),
        confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
        manageServicesBtn: document.getElementById('manageServicesBtn'),
        manageDestinationsBtn: document.getElementById('manageDestinationsBtn'),
        manageFleetBtn: document.getElementById('manageFleetBtn'),
        saveServiceBtn: document.getElementById('saveServiceBtn'),
        saveDestinationBtn: document.getElementById('saveDestinationBtn'),
        saveFleetBtn: document.getElementById('saveFleetBtn'),
        addNewItemBtn: document.getElementById('addNewItemBtn'),
        serviceUploadBtn: document.getElementById('serviceUploadBtn'),
        destinationUploadBtn: document.getElementById('destinationUploadBtn'),
        fleetUploadBtn: document.getElementById('fleetUploadBtn'),
        
        // Modals
        bookingModal: document.getElementById('bookingModal'),
        bookingModalLabel: document.getElementById('bookingModalLabel'),
        bookingForm: document.getElementById('bookingForm'),
        tourModal: document.getElementById('tourModal'),
        tourModalLabel: document.getElementById('tourModalLabel'),
        tourForm: document.getElementById('tourForm'),
        customerModal: document.getElementById('customerModal'),
        customerModalLabel: document.getElementById('customerModalLabel'),
        customerForm: document.getElementById('customerForm'),
        serviceModal: document.getElementById('serviceModal'),
        serviceModalLabel: document.getElementById('serviceModalLabel'),
        serviceForm: document.getElementById('serviceForm'),
        destinationModal: document.getElementById('destinationModal'),
        destinationModalLabel: document.getElementById('destinationModalLabel'),
        destinationForm: document.getElementById('destinationForm'),
        fleetModal: document.getElementById('fleetModal'),
        fleetModalLabel: document.getElementById('fleetModalLabel'),
        fleetForm: document.getElementById('fleetForm'),
        managementModal: document.getElementById('managementModal'),
        managementModalLabel: document.getElementById('managementModalLabel'),
        managementTableHeader: document.getElementById('managementTableHeader'),
        managementTableBody: document.getElementById('managementTableBody'),
        
        // Form fields
        bookingId: document.getElementById('bookingId'),
        tourSelect: document.getElementById('tourSelect'),
        customerSelect: document.getElementById('customerSelect'),
        bookingDate: document.getElementById('bookingDate'),
        numGuests: document.getElementById('numGuests'),
        bookingStatus: document.getElementById('bookingStatus'),
        paymentStatus: document.getElementById('paymentStatus'),
        totalAmount: document.getElementById('totalAmount'),
        bookingNotes: document.getElementById('bookingNotes'),
        tourInfo: document.getElementById('tourInfo'),
        
        // Form fields - Tour
        tourId: document.getElementById('tourId'),
        tourDestination: document.getElementById('tourDestination'),
        tourDescription: document.getElementById('tourDescription'),
        tourStartDate: document.getElementById('tourStartDate'),
        tourEndDate: document.getElementById('tourEndDate'),
        tourCapacity: document.getElementById('tourCapacity'),
        tourPrice: document.getElementById('tourPrice'),
        tourStatus: document.getElementById('tourStatus'),
        tourImageUrl: document.getElementById('tourImageUrl'),
        
        // Form fields - Customer
        customerId: document.getElementById('customerId'),
        customerFirstName: document.getElementById('customerFirstName'),
        customerLastName: document.getElementById('customerLastName'),
        customerEmail: document.getElementById('customerEmail'),
        customerPhone: document.getElementById('customerPhone'),
        customerAddress: document.getElementById('customerAddress'),
        
        // Delete modal
        deleteModal: document.getElementById('deleteModal'),
        deleteModalTitle: document.getElementById('deleteModalTitle'),
        deleteModalBody: document.getElementById('deleteModalBody'),
        deleteBookingId: document.getElementById('deleteBookingId'),
        deleteTourId: document.getElementById('deleteTourId'),
        deleteCustomerId: document.getElementById('deleteCustomerId'),
        deleteType: document.getElementById('deleteType'),
        
        // Other
        currentTime: document.getElementById('currentTime'),
        todayDate: document.getElementById('todayDate'),
        greetingText: document.getElementById('greetingText'),
        toastContainer: document.getElementById('toastContainer')
    };
    
    // Bootstrap modal instances
    let bookingModalInstance = null;
    let tourModalInstance = null;
    let customerModalInstance = null;
    let deleteModalInstance = null;
    
    // =========================================
    // INITIALIZATION
    // =========================================
    
    /**
     * Initialize the dashboard
     */
    async function init() {
        console.log('RTS Dashboard initializing...');
        
        // Initialize Bootstrap modals
        bookingModalInstance = new bootstrap.Modal(elements.bookingModal);
        tourModalInstance = new bootstrap.Modal(elements.tourModal);
        customerModalInstance = new bootstrap.Modal(elements.customerModal);
        deleteModalInstance = new bootstrap.Modal(elements.deleteModal);
        
        // Setup event listeners
        setupEventListeners();
        
        // Update time and greeting
        updateDateTime();
        setInterval(updateDateTime, 1000);
        
        // Load initial data
        await loadDashboard();
        
        console.log('RTS Dashboard initialized successfully');
    }
    
    /**
     * Setup all event listeners
     */
    function setupEventListeners() {
        // Buttons
        elements.newBookingBtn.addEventListener('click', () => showBookingModal());
        elements.newTourBtn.addEventListener('click', () => showTourModal());
        elements.newCustomerBtn.addEventListener('click', () => showCustomerModal());
        elements.refreshBtn.addEventListener('click', loadDashboard);
        elements.saveBookingBtn.addEventListener('click', handleFormSubmit);
        elements.saveTourBtn.addEventListener('click', handleTourSubmit);
        elements.saveCustomerBtn.addEventListener('click', handleCustomerSubmit);
        elements.confirmDeleteBtn.addEventListener('click', handleDelete);
        
        // Landing page management
        if (elements.manageServicesBtn) {
            elements.manageServicesBtn.addEventListener('click', () => showManagementTable('services'));
        }
        if (elements.manageDestinationsBtn) {
            elements.manageDestinationsBtn.addEventListener('click', () => showManagementTable('destinations'));
        }
        if (elements.manageFleetBtn) {
            elements.manageFleetBtn.addEventListener('click', () => showManagementTable('fleet'));
        }
        if (elements.addNewItemBtn) {
            elements.addNewItemBtn.addEventListener('click', handleAddNewItem);
        }
        if (elements.saveServiceBtn) {
            elements.saveServiceBtn.addEventListener('click', handleServiceSubmit);
        }
        if (elements.saveDestinationBtn) {
            elements.saveDestinationBtn.addEventListener('click', handleDestinationSubmit);
        }
        if (elements.saveFleetBtn) {
            elements.saveFleetBtn.addEventListener('click', handleFleetSubmit);
        }
        if (elements.serviceUploadBtn) {
            elements.serviceUploadBtn.addEventListener('click', () => document.getElementById('serviceImageFile').click());
        }
        if (elements.destinationUploadBtn) {
            elements.destinationUploadBtn.addEventListener('click', () => document.getElementById('destinationImageFile').click());
        }
        if (elements.fleetUploadBtn) {
            elements.fleetUploadBtn.addEventListener('click', () => document.getElementById('fleetImageFile').click());
        }
        
        // Image upload handlers
        const serviceImageFile = document.getElementById('serviceImageFile');
        const destinationImageFile = document.getElementById('destinationImageFile');
        const fleetImageFile = document.getElementById('fleetImageFile');
        if (serviceImageFile) {
            serviceImageFile.addEventListener('change', (e) => handleImageUpload(e, 'services', 'serviceImageUrl', 'serviceImagePreview'));
        }
        if (destinationImageFile) {
            destinationImageFile.addEventListener('change', (e) => handleImageUpload(e, 'destinations', 'destinationImageUrl', 'destinationImagePreview'));
        }
        if (fleetImageFile) {
            fleetImageFile.addEventListener('change', (e) => handleImageUpload(e, 'fleet', 'fleetImageUrl', 'fleetImagePreview'));
        }
        
        // Filters
        elements.searchInput.addEventListener('input', debounce(handleSearch, 300));
        elements.statusFilter.addEventListener('change', handleFilterChange);
        
        // Form events
        elements.tourSelect.addEventListener('change', handleTourChange);
        elements.numGuests.addEventListener('change', calculateTotal);
        
        // Modal events
        elements.bookingModal.addEventListener('hidden.bs.modal', resetForm);
        elements.tourModal.addEventListener('hidden.bs.modal', resetTourForm);
        elements.customerModal.addEventListener('hidden.bs.modal', resetCustomerForm);
        if (elements.serviceModal) {
            elements.serviceModal.addEventListener('hidden.bs.modal', resetServiceForm);
        }
        if (elements.destinationModal) {
            elements.destinationModal.addEventListener('hidden.bs.modal', resetDestinationForm);
        }
        if (elements.fleetModal) {
            elements.fleetModal.addEventListener('hidden.bs.modal', resetFleetForm);
        }
    }
    
    // =========================================
    // DATA LOADING
    // =========================================
    
    /**
     * Load all dashboard data
     */
    async function loadDashboard() {
        try {
            setLoading(true);
            
            // Load all data in parallel
            // Convert page to offset for API
            const offset = (state.pagination.currentPage - 1) * state.pagination.itemsPerPage;
            const params = {
                ...state.filters,
                limit: state.pagination.itemsPerPage,
                offset: offset
            };
            
            const [statsResult, bookingsResult, toursResult, customersResult] = await Promise.all([
                API.fetchDashboardStats(),
                API.fetchBookings(params),
                API.fetchTours(),
                API.fetchCustomers()
            ]);
            
            // Update state
            state.stats = statsResult.data;
            state.bookings = bookingsResult.data.bookings || [];
            state.tours = toursResult.data.tours;
            state.customers = customersResult.data.customers;
            
            // Update pagination info
            if (bookingsResult.data.total !== undefined) {
                state.pagination.totalItems = bookingsResult.data.total;
                state.pagination.totalPages = Math.ceil(bookingsResult.data.total / state.pagination.itemsPerPage);
            }
            
            // Render UI
            renderStats(state.stats);
            renderBookings(state.bookings);
            renderPagination();
            renderUpcomingTours(state.stats.upcoming_tours);
            renderCustomers(state.customers);
            populateFormSelects();
            
        } catch (error) {
            showToast('Failed to load dashboard data', 'error');
            console.error('Dashboard load error:', error);
        } finally {
            setLoading(false);
        }
    }
    
    /**
     * Load bookings with current filters and pagination
     */
    async function loadBookings() {
        try {
            setLoading(true);
            
            // Convert page to offset for API
            const offset = (state.pagination.currentPage - 1) * state.pagination.itemsPerPage;
            
            const params = {
                ...state.filters,
                limit: state.pagination.itemsPerPage,
                offset: offset
            };
            
            const result = await API.fetchBookings(params);
            state.bookings = result.data.bookings || [];
            
            // Update pagination info from API response
            if (result.data.total !== undefined) {
                state.pagination.totalItems = result.data.total;
                state.pagination.totalPages = Math.ceil(result.data.total / state.pagination.itemsPerPage);
            }
            
            renderBookings(state.bookings);
            renderPagination();
            
        } catch (error) {
            showToast('Failed to load bookings', 'error');
            console.error('Bookings load error:', error);
        } finally {
            setLoading(false);
        }
    }
    
    // =========================================
    // RENDERING FUNCTIONS
    // =========================================
    
    /**
     * Render dashboard statistics
     */
    function renderStats(stats) {
        if (!stats) return;
        
        elements.statTotalBookings.textContent = stats.total_bookings;
        elements.statPending.textContent = stats.pending_bookings;
        elements.statConfirmed.textContent = stats.confirmed_bookings;
        elements.statRevenue.textContent = formatCurrency(stats.total_revenue);
        elements.statActiveTours.textContent = stats.active_tours;
        elements.statCustomers.textContent = stats.total_customers;
        elements.statRecentBookings.textContent = stats.recent_bookings;
        elements.statCollected.textContent = formatCurrency(stats.collected_revenue);
    }
    
    /**
     * Render bookings table
     */
    function renderBookings(bookings) {
        if (!bookings || bookings.length === 0) {
            elements.bookingsTableBody.innerHTML = '';
            elements.emptyState.classList.remove('d-none');
            return;
        }
        
        elements.emptyState.classList.add('d-none');
        
        const html = bookings.map((booking, index) => `
            <tr class="stagger-item" style="animation-delay: ${index * 0.05}s">
                <td>
                    <span class="text-azure">#${booking.booking_id}</span>
                </td>
                <td>
                    <div class="customer-cell">
                        <span class="customer-name">${escapeHtml(booking.customer_name)}</span>
                        <span class="customer-email">${escapeHtml(booking.email)}</span>
                    </div>
                </td>
                <td>
                    <div class="tour-cell">
                        <span class="tour-destination">${escapeHtml(booking.destination)}</span>
                    </div>
                </td>
                <td>
                    <span>${formatDate(booking.booking_date)}</span>
                </td>
                <td>
                    <span class="status-badge status-${booking.booking_status}">
                        ${booking.booking_status}
                    </span>
                </td>
                <td>
                    <span class="amount-cell">${formatCurrency(booking.total_amount)}</span>
                    <span class="payment-badge payment-${booking.payment_status}">${booking.payment_status}</span>
                </td>
                <td>
                    <div class="d-flex gap-1" data-bs-theme="dark">
                        <button class="action-btn edit" onclick="App.editBooking(${booking.booking_id})" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="action-btn delete" onclick="App.confirmDelete(${booking.booking_id})" title="Cancel">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        elements.bookingsTableBody.innerHTML = html;
    }
    
    /**
     * Render upcoming tours in sidebar
     */
    function renderUpcomingTours(tours) {
        if (!tours || tours.length === 0) {
            elements.upcomingTours.innerHTML = `
                <div class="text-center text-muted py-3">
                    <i class="bi bi-calendar-x d-block mb-2" style="font-size: 2rem;"></i>
                    <small>No upcoming tours</small>
                </div>
            `;
            return;
        }
        
        const html = tours.map((tour, index) => {
            const available = tour.capacity - tour.guests_booked;
            const percentage = Math.round((tour.guests_booked / tour.capacity) * 100);
            
            return `
                <div class="tour-item stagger-item" style="animation-delay: ${index * 0.1}s">
                    <div class="tour-icon">
                        <i class="bi bi-geo-alt-fill"></i>
                    </div>
                    <div class="tour-info flex-grow-1">
                        <div class="tour-name">${escapeHtml(tour.destination)}</div>
                        <div class="tour-date">
                            <i class="bi bi-calendar me-1"></i>${formatDate(tour.start_date)}
                        </div>
                    </div>
                    <div class="tour-capacity me-2">
                        <div class="tour-capacity-value">${available}/${tour.capacity}</div>
                        <div class="tour-capacity-label">Available</div>
                    </div>
                    <div class="d-flex gap-1" data-bs-theme="dark">
                        <button class="action-btn edit" onclick="App.editTour(${tour.id})" title="Edit Tour">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="action-btn delete" onclick="App.confirmDeleteTour(${tour.id})" title="Delete Tour">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        elements.upcomingTours.innerHTML = html;
    }
    
    /**
     * Render customers list in sidebar
     */
    function renderCustomers(customers) {
        if (!customers || customers.length === 0) {
            if (elements.customersList) {
                elements.customersList.innerHTML = `
                    <div class="text-center text-muted py-3">
                        <i class="bi bi-people d-block mb-2" style="font-size: 2rem;"></i>
                        <small>No customers</small>
                    </div>
                `;
            }
            return;
        }
        
        if (!elements.customersList) return;
        
        // Show first 5 customers
        const displayCustomers = customers.slice(0, 5);
        const html = displayCustomers.map((customer, index) => {
            const fullName = `${escapeHtml(customer.first_name)} ${escapeHtml(customer.last_name)}`;
            return `
                <div class="customer-item stagger-item d-flex align-items-center justify-content-between py-2" style="animation-delay: ${index * 0.1}s">
                    <div class="flex-grow-1">
                        <div class="customer-name-small">${fullName}</div>
                        <div class="customer-email-small text-muted">${escapeHtml(customer.email)}</div>
                    </div>
                    <div class="d-flex gap-1" data-bs-theme="dark">
                        <button class="action-btn edit" onclick="App.editCustomer(${customer.id})" title="Edit Customer">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="action-btn delete" onclick="App.confirmDeleteCustomer(${customer.id})" title="Delete Customer">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        const moreCount = customers.length > 5 ? `<div class="text-center text-muted py-2"><small>+${customers.length - 5} more</small></div>` : '';
        elements.customersList.innerHTML = html + moreCount;
    }
    
    /**
     * Populate form select dropdowns
     */
    function populateFormSelects() {
        // Populate tours
        const tourOptions = state.tours.map(tour => 
            `<option value="${tour.id}" data-price="${tour.price}">
                ${escapeHtml(tour.destination)} - ${formatCurrency(tour.price)}
            </option>`
        ).join('');
        elements.tourSelect.innerHTML = '<option value="">Select a tour...</option>' + tourOptions;
        
        // Populate customers
        const customerOptions = state.customers.map(customer => 
            `<option value="${customer.id}">
                ${escapeHtml(customer.first_name)} ${escapeHtml(customer.last_name)} (${escapeHtml(customer.email)})
            </option>`
        ).join('');
        elements.customerSelect.innerHTML = '<option value="">Select a customer...</option>' + customerOptions;
    }
    
    // =========================================
    // MODAL & FORM HANDLING
    // =========================================
    
    /**
     * Show booking modal (create or edit)
     */
    function showBookingModal(bookingId = null) {
        state.currentBookingId = bookingId;
        
        if (bookingId) {
            // Edit mode - load booking data
            const booking = state.bookings.find(b => b.booking_id === bookingId);
            if (booking) {
                elements.bookingModalLabel.innerHTML = '<i class="bi bi-pencil-square me-2"></i>Edit Booking';
                elements.bookingId.value = booking.booking_id;
                elements.tourSelect.value = booking.tour_id;
                elements.customerSelect.value = booking.customer_id;
                elements.bookingDate.value = booking.booking_date;
                elements.numGuests.value = booking.num_guests;
                elements.bookingStatus.value = booking.booking_status;
                elements.paymentStatus.value = booking.payment_status;
                elements.totalAmount.value = booking.total_amount;
                elements.bookingNotes.value = booking.notes || '';
                handleTourChange();
            }
        } else {
            // Create mode
            elements.bookingModalLabel.innerHTML = '<i class="bi bi-calendar-plus me-2"></i>New Booking';
            elements.bookingDate.value = new Date().toISOString().split('T')[0];
        }
        
        bookingModalInstance.show();
    }
    
    /**
     * Handle tour selection change
     */
    function handleTourChange() {
        const selectedOption = elements.tourSelect.selectedOptions[0];
        if (selectedOption && selectedOption.value) {
            const tour = state.tours.find(t => t.id == selectedOption.value);
            if (tour) {
                elements.tourInfo.textContent = `${formatDate(tour.start_date)} - ${formatDate(tour.end_date)}`;
                calculateTotal();
            }
        } else {
            elements.tourInfo.textContent = '';
        }
    }
    
    /**
     * Calculate total amount based on tour and guests
     */
    function calculateTotal() {
        const selectedOption = elements.tourSelect.selectedOptions[0];
        if (selectedOption && selectedOption.value) {
            const price = parseFloat(selectedOption.dataset.price) || 0;
            const guests = parseInt(elements.numGuests.value) || 1;
            elements.totalAmount.value = (price * guests).toFixed(2);
        }
    }
    
    /**
     * Handle form submission
     */
    async function handleFormSubmit() {
        // Validate form
        if (!elements.bookingForm.checkValidity()) {
            elements.bookingForm.reportValidity();
            return;
        }
        
        // Gather form data
        const data = {
            tour_id: parseInt(elements.tourSelect.value),
            customer_id: parseInt(elements.customerSelect.value),
            booking_date: elements.bookingDate.value,
            num_guests: parseInt(elements.numGuests.value),
            status: elements.bookingStatus.value,
            payment_status: elements.paymentStatus.value,
            total_amount: parseFloat(elements.totalAmount.value) || 0,
            notes: elements.bookingNotes.value.trim()
        };
        
        try {
            elements.saveBookingBtn.disabled = true;
            elements.saveBookingBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
            
            if (state.currentBookingId) {
                // Update existing
                await API.updateBooking(state.currentBookingId, data);
                showToast('Booking updated successfully', 'success');
            } else {
                // Create new
                await API.createBooking(data);
                showToast('Booking created successfully', 'success');
            }
            
            // Close modal and refresh
            bookingModalInstance.hide();
            await loadDashboard();
            
        } catch (error) {
            showToast(error.message || 'Failed to save booking', 'error');
            console.error('Save error:', error);
        } finally {
            elements.saveBookingBtn.disabled = false;
            elements.saveBookingBtn.innerHTML = '<i class="bi bi-check-lg me-2"></i>Save Booking';
        }
    }
    
    /**
     * Reset form to initial state
     */
    function resetForm() {
        state.currentBookingId = null;
        elements.bookingForm.reset();
        elements.bookingId.value = '';
        elements.tourInfo.textContent = '';
        elements.totalAmount.value = '';
        elements.bookingStatus.value = 'pending';
        elements.paymentStatus.value = 'unpaid';
        elements.numGuests.value = 1;
    }
    
    /**
     * Show tour modal (create or edit)
     */
    function showTourModal(tourId = null) {
        state.currentTourId = tourId;
        
        if (tourId) {
            // Edit mode - load tour data
            loadTourForEdit(tourId);
        } else {
            // Create mode
            resetTourForm();
            tourModalInstance.show();
        }
    }
    
    /**
     * Load tour data for editing
     */
    async function loadTourForEdit(tourId) {
        try {
            const result = await API.fetchTour(tourId);
            const tour = result.data;
            
            elements.tourModalLabel.innerHTML = '<i class="bi bi-pencil-square me-2"></i>Edit Tour';
            elements.tourId.value = tour.id;
            elements.tourDestination.value = tour.destination;
            elements.tourDescription.value = tour.description || '';
            elements.tourStartDate.value = tour.start_date;
            elements.tourEndDate.value = tour.end_date;
            elements.tourCapacity.value = tour.capacity;
            elements.tourPrice.value = tour.price;
            elements.tourStatus.value = tour.status;
            elements.tourImageUrl.value = tour.image_url || '';
            
            tourModalInstance.show();
        } catch (error) {
            showToast(error.message || 'Failed to load tour', 'error');
            console.error('Tour load error:', error);
        }
    }
    
    /**
     * Show customer modal (create or edit)
     */
    function showCustomerModal(customerId = null) {
        state.currentCustomerId = customerId;
        
        if (customerId) {
            // Edit mode - load customer data
            loadCustomerForEdit(customerId);
        } else {
            // Create mode
            resetCustomerForm();
            customerModalInstance.show();
        }
    }
    
    /**
     * Load customer data for editing
     */
    async function loadCustomerForEdit(customerId) {
        try {
            const result = await API.fetchCustomer(customerId);
            const customer = result.data;
            
            elements.customerModalLabel.innerHTML = '<i class="bi bi-pencil-square me-2"></i>Edit Customer';
            elements.customerId.value = customer.id;
            elements.customerFirstName.value = customer.first_name;
            elements.customerLastName.value = customer.last_name;
            elements.customerEmail.value = customer.email;
            elements.customerPhone.value = customer.phone || '';
            elements.customerAddress.value = customer.address || '';
            
            customerModalInstance.show();
        } catch (error) {
            showToast(error.message || 'Failed to load customer', 'error');
            console.error('Customer load error:', error);
        }
    }
    
    /**
     * Reset tour form
     */
    function resetTourForm() {
        if (elements.tourForm) {
            state.currentTourId = null;
            elements.tourForm.reset();
            elements.tourId.value = '';
            elements.tourModalLabel.innerHTML = '<i class="bi bi-geo-alt me-2"></i>New Tour';
            if (elements.tourStatus) elements.tourStatus.value = 'active';
            if (elements.tourCapacity) elements.tourCapacity.value = '20';
        }
    }
    
    /**
     * Reset customer form
     */
    function resetCustomerForm() {
        if (elements.customerForm) {
            state.currentCustomerId = null;
            elements.customerForm.reset();
            elements.customerId.value = '';
            elements.customerModalLabel.innerHTML = '<i class="bi bi-person-plus me-2"></i>New Customer';
        }
    }
    
    /**
     * Handle tour form submission
     */
    async function handleTourSubmit() {
        // Validate form
        if (!elements.tourForm.checkValidity()) {
            elements.tourForm.reportValidity();
            return;
        }
        
        // Gather form data
        const data = {
            destination: elements.tourDestination.value.trim(),
            description: elements.tourDescription.value.trim() || null,
            start_date: elements.tourStartDate.value,
            end_date: elements.tourEndDate.value,
            capacity: parseInt(elements.tourCapacity.value),
            price: parseFloat(elements.tourPrice.value),
            status: elements.tourStatus.value,
            image_url: elements.tourImageUrl.value.trim() || null
        };
        
        try {
            elements.saveTourBtn.disabled = true;
            const isEdit = state.currentTourId !== null;
            elements.saveTourBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${isEdit ? 'Updating...' : 'Creating...'}`;
            
            if (isEdit) {
                // Update existing
                await API.updateTour(state.currentTourId, data);
                showToast('Tour updated successfully', 'success');
            } else {
                // Create new
                await API.createTour(data);
                showToast('Tour created successfully', 'success');
            }
            
            tourModalInstance.hide();
            
            // Reload tours and refresh booking form dropdown
            await loadDashboard();
            
        } catch (error) {
            showToast(error.message || `Failed to ${state.currentTourId ? 'update' : 'create'} tour`, 'error');
            console.error('Tour save error:', error);
        } finally {
            elements.saveTourBtn.disabled = false;
            elements.saveTourBtn.innerHTML = '<i class="bi bi-check-lg me-2"></i>Save Tour';
        }
    }
    
    /**
     * Handle customer form submission
     */
    async function handleCustomerSubmit() {
        // Validate form
        if (!elements.customerForm.checkValidity()) {
            elements.customerForm.reportValidity();
            return;
        }
        
        // Gather form data
        const data = {
            first_name: elements.customerFirstName.value.trim(),
            last_name: elements.customerLastName.value.trim(),
            email: elements.customerEmail.value.trim(),
            phone: elements.customerPhone.value.trim() || null,
            address: elements.customerAddress.value.trim() || null
        };
        
        try {
            elements.saveCustomerBtn.disabled = true;
            const isEdit = state.currentCustomerId !== null;
            elements.saveCustomerBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${isEdit ? 'Updating...' : 'Creating...'}`;
            
            let result;
            if (isEdit) {
                // Update existing
                result = await API.updateCustomer(state.currentCustomerId, data);
                showToast('Customer updated successfully', 'success');
            } else {
                // Create new
                result = await API.createCustomer(data);
                showToast('Customer created successfully', 'success');
            }
            
            customerModalInstance.hide();
            
            // Reload customers and refresh booking form dropdown
            await loadDashboard();
            
            // If booking modal is open, select the new/updated customer
            if (bookingModalInstance && bookingModalInstance._isShown) {
                elements.customerSelect.value = result.data.id;
            }
            
        } catch (error) {
            showToast(error.message || `Failed to ${state.currentCustomerId ? 'update' : 'create'} customer`, 'error');
            console.error('Customer save error:', error);
        } finally {
            elements.saveCustomerBtn.disabled = false;
            elements.saveCustomerBtn.innerHTML = '<i class="bi bi-check-lg me-2"></i>Save Customer';
        }
    }
    
    // =========================================
    // DELETE HANDLING
    // =========================================
    
    /**
     * Show delete confirmation modal
     */
    function confirmDelete(bookingId) {
        elements.deleteType.value = 'booking';
        elements.deleteBookingId.value = bookingId;
        elements.deleteTourId.value = '';
        elements.deleteCustomerId.value = '';
        elements.deleteModalTitle.innerHTML = '<i class="bi bi-exclamation-triangle me-2"></i>Cancel Booking';
        elements.deleteModalBody.innerHTML = `
            <p>Are you sure you want to cancel this booking?</p>
            <p class="text-muted small">This will change the booking status to "Cancelled" and mark payment as "Refunded".</p>
        `;
        elements.confirmDeleteBtn.innerHTML = '<i class="bi bi-x-lg me-2"></i>Yes, Cancel Booking';
        deleteModalInstance.show();
    }
    
    /**
     * Show delete confirmation modal for tour
     */
    function confirmDeleteTour(tourId) {
        elements.deleteType.value = 'tour';
        elements.deleteTourId.value = tourId;
        elements.deleteBookingId.value = '';
        elements.deleteCustomerId.value = '';
        elements.deleteModalTitle.innerHTML = '<i class="bi bi-exclamation-triangle me-2"></i>Delete Tour';
        elements.deleteModalBody.innerHTML = `
            <p>Are you sure you want to delete this tour?</p>
            <p class="text-muted small">This action cannot be undone. If the tour has active bookings, you may need to cancel them first.</p>
        `;
        elements.confirmDeleteBtn.innerHTML = '<i class="bi bi-trash me-2"></i>Yes, Delete Tour';
        deleteModalInstance.show();
    }
    
    /**
     * Show delete confirmation modal for customer
     */
    function confirmDeleteCustomer(customerId) {
        elements.deleteType.value = 'customer';
        elements.deleteCustomerId.value = customerId;
        elements.deleteBookingId.value = '';
        elements.deleteTourId.value = '';
        elements.deleteModalTitle.innerHTML = '<i class="bi bi-exclamation-triangle me-2"></i>Delete Customer';
        elements.deleteModalBody.innerHTML = `
            <p>Are you sure you want to delete this customer?</p>
            <p class="text-muted small">This action cannot be undone. Customer bookings will remain but will show as deleted customer.</p>
        `;
        elements.confirmDeleteBtn.innerHTML = '<i class="bi bi-trash me-2"></i>Yes, Delete Customer';
        deleteModalInstance.show();
    }
    
    /**
     * Handle delete confirmation
     */
    async function handleDelete() {
        const deleteType = elements.deleteType.value;
        
        try {
            elements.confirmDeleteBtn.disabled = true;
            elements.confirmDeleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
            
            if (deleteType === 'booking') {
                const bookingId = parseInt(elements.deleteBookingId.value);
                await API.deleteBooking(bookingId);
                showToast('Booking cancelled successfully', 'success');
            } else if (deleteType === 'tour') {
                const tourId = parseInt(elements.deleteTourId.value);
                await API.deleteTour(tourId);
                showToast('Tour deleted successfully', 'success');
            } else if (deleteType === 'customer') {
                const customerId = parseInt(elements.deleteCustomerId.value);
                await API.deleteCustomer(customerId);
                showToast('Customer deleted successfully', 'success');
            }
            
            deleteModalInstance.hide();
            await loadDashboard();
            
        } catch (error) {
            const action = deleteType === 'booking' ? 'cancel booking' : deleteType === 'tour' ? 'delete tour' : 'delete customer';
            showToast(error.message || `Failed to ${action}`, 'error');
            console.error('Delete error:', error);
        } finally {
            elements.confirmDeleteBtn.disabled = false;
            const buttonText = deleteType === 'booking' ? 'Yes, Cancel Booking' : deleteType === 'tour' ? 'Yes, Delete Tour' : 'Yes, Delete Customer';
            elements.confirmDeleteBtn.innerHTML = `<i class="bi ${deleteType === 'booking' ? 'bi-x-lg' : 'bi-trash'} me-2"></i>${buttonText}`;
        }
    }
    
    // =========================================
    // FILTER HANDLING
    // =========================================
    
    /**
     * Render pagination controls
     */
    function renderPagination() {
        if (!elements.paginationContainer) return;
        
        const { currentPage, totalPages, totalItems, itemsPerPage } = state.pagination;
        
        // Hide pagination if no items
        if (totalItems === 0) {
            elements.paginationContainer.classList.add('d-none');
            return;
        }
        
        elements.paginationContainer.classList.remove('d-none');
        
        // Update pagination info
        if (elements.paginationInfo) {
            const start = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
            const end = Math.min(currentPage * itemsPerPage, totalItems);
            elements.paginationInfo.textContent = `Showing ${start}-${end} of ${totalItems} bookings`;
        }
        
        // Update prev/next buttons
        if (elements.prevPageBtn) {
            elements.prevPageBtn.disabled = currentPage === 1;
            elements.prevPageBtn.classList.toggle('disabled', currentPage === 1);
        }
        
        if (elements.nextPageBtn) {
            elements.nextPageBtn.disabled = currentPage === totalPages;
            elements.nextPageBtn.classList.toggle('disabled', currentPage === totalPages);
        }
        
        // Render page numbers
        if (elements.pageNumbers) {
            const pageNumbers = [];
            const maxVisible = 5;
            let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
            let endPage = Math.min(totalPages, startPage + maxVisible - 1);
            
            if (endPage - startPage < maxVisible - 1) {
                startPage = Math.max(1, endPage - maxVisible + 1);
            }
            
            // First page
            if (startPage > 1) {
                pageNumbers.push(`<button class="page-btn" onclick="App.goToPage(1)">1</button>`);
                if (startPage > 2) {
                    pageNumbers.push(`<span class="page-ellipsis">...</span>`);
                }
            }
            
            // Page range
            for (let i = startPage; i <= endPage; i++) {
                const active = i === currentPage ? 'active' : '';
                pageNumbers.push(`<button class="page-btn ${active}" onclick="App.goToPage(${i})">${i}</button>`);
            }
            
            // Last page
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    pageNumbers.push(`<span class="page-ellipsis">...</span>`);
                }
                pageNumbers.push(`<button class="page-btn" onclick="App.goToPage(${totalPages})">${totalPages}</button>`);
            }
            
            elements.pageNumbers.innerHTML = pageNumbers.join('');
        }
    }
    
    /**
     * Navigate to specific page
     */
    function goToPage(page) {
        if (page < 1 || page > state.pagination.totalPages) return;
        state.pagination.currentPage = page;
        loadBookings();
        // Scroll to top of table
        elements.bookingsTableBody?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    /**
     * Go to previous page
     */
    function goToPrevPage() {
        if (state.pagination.currentPage > 1) {
            goToPage(state.pagination.currentPage - 1);
        }
    }
    
    /**
     * Go to next page
     */
    function goToNextPage() {
        if (state.pagination.currentPage < state.pagination.totalPages) {
            goToPage(state.pagination.currentPage + 1);
        }
    }
    
    /**
     * Handle search input
     */
    function handleSearch(e) {
        state.filters.search = e.target.value.trim();
        state.pagination.currentPage = 1; // Reset to first page on search
        loadBookings();
    }
    
    /**
     * Handle status filter change
     */
    function handleFilterChange() {
        state.filters.status = elements.statusFilter.value;
        state.pagination.currentPage = 1; // Reset to first page on filter change
        loadBookings();
    }
    
    // =========================================
    // UI HELPERS
    // =========================================
    
    /**
     * Set loading state
     */
    function setLoading(loading) {
        state.isLoading = loading;
        if (loading) {
            elements.tableLoading.classList.remove('d-none');
        } else {
            elements.tableLoading.classList.add('d-none');
        }
    }
    
    /**
     * Update current time and date display
     */
    function updateDateTime() {
        const now = new Date();
        
        // Time
        elements.currentTime.textContent = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Date
        elements.todayDate.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Greeting
        const hour = now.getHours();
        let greeting = 'Good evening';
        if (hour < 12) greeting = 'Good morning';
        else if (hour < 17) greeting = 'Good afternoon';
        elements.greetingText.textContent = greeting;
    }
    
    /**
     * Show toast notification
     */
    function showToast(message, type = 'info') {
        const toastId = 'toast-' + Date.now();
        const iconMap = {
            success: 'bi-check-circle-fill text-success',
            error: 'bi-exclamation-circle-fill text-danger',
            warning: 'bi-exclamation-triangle-fill text-warning',
            info: 'bi-info-circle-fill text-info'
        };
        
        const html = `
            <div id="${toastId}" class="toast toast-${type}" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <i class="bi ${iconMap[type]} me-2"></i>
                    <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    ${escapeHtml(message)}
                </div>
            </div>
        `;
        
        elements.toastContainer.insertAdjacentHTML('beforeend', html);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
        toast.show();
        
        // Remove from DOM after hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
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
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
    
    /**
     * Format date
     */
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
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
    
    // =========================================
    // LANDING PAGE MANAGEMENT FUNCTIONS
    // =========================================
    
    /**
     * Show management table for services, destinations, or fleet
     */
    async function showManagementTable(type) {
        state.currentManagementType = type;
        const modal = new bootstrap.Modal(elements.managementModal);
        
        // Set modal title
        const titles = {
            services: 'Manage Services',
            destinations: 'Manage Destinations',
            fleet: 'Manage Fleet'
        };
        elements.managementModalLabel.innerHTML = `<i class="bi bi-list-ul me-2"></i>${titles[type]}`;
        
        // Load data
        try {
            setLoading(true);
            let response;
            if (type === 'services') {
                response = await API.fetchServices();
                state.services = response.data?.services || [];
            } else if (type === 'destinations') {
                response = await API.fetchDestinations();
                state.destinations = response.data?.destinations || [];
            } else if (type === 'fleet') {
                response = await API.fetchFleet();
                state.fleet = response.data?.fleet || [];
            }
            
            renderManagementTable(type);
            modal.show();
        } catch (error) {
            showToast('Failed to load data', 'error');
            console.error('Error loading management data:', error);
        } finally {
            setLoading(false);
        }
    }
    
    /**
     * Render management table
     */
    function renderManagementTable(type) {
        const headers = {
            services: ['Type', 'Name', 'Icon', 'Active', 'Order', 'Actions'],
            destinations: ['Name', 'Duration', 'Capacity', 'Featured', 'Order', 'Actions'],
            fleet: ['Vehicle Type', 'Capacity', 'Price/Day', 'Featured', 'Order', 'Actions']
        };
        
        // Render header
        elements.managementTableHeader.innerHTML = headers[type].map(h => `<th>${h}</th>`).join('');
        
        // Render body
        let data = [];
        if (type === 'services') {
            data = state.services;
        } else if (type === 'destinations') {
            data = state.destinations;
        } else if (type === 'fleet') {
            data = state.fleet;
        }
        
        if (data.length === 0) {
            elements.managementTableBody.innerHTML = `<tr><td colspan="${headers[type].length}" class="text-center text-muted">No items found</td></tr>`;
            return;
        }
        
        elements.managementTableBody.innerHTML = data.map(item => {
            if (type === 'services') {
                return `
                    <tr>
                        <td>${escapeHtml(item.service_type)}</td>
                        <td>${escapeHtml(item.name)}</td>
                        <td><i class="${escapeHtml(item.icon_class || 'bi bi-star')}"></i></td>
                        <td>${item.is_active ? '<span class="badge bg-success">Yes</span>' : '<span class="badge bg-secondary">No</span>'}</td>
                        <td>${item.display_order}</td>
                        <td>
                            <button class="btn btn-sm btn-glass me-1" onclick="App.editService(${item.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="App.confirmDeleteService(${item.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            } else if (type === 'destinations') {
                return `
                    <tr>
                        <td>${escapeHtml(item.name)}</td>
                        <td>${item.duration_hours} hrs</td>
                        <td>${item.max_capacity}</td>
                        <td>${item.is_featured ? '<span class="badge bg-success">Yes</span>' : '<span class="badge bg-secondary">No</span>'}</td>
                        <td>${item.display_order}</td>
                        <td>
                            <button class="btn btn-sm btn-glass me-1" onclick="App.editDestination(${item.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="App.confirmDeleteDestination(${item.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            } else if (type === 'fleet') {
                return `
                    <tr>
                        <td>${escapeHtml(item.vehicle_type)}</td>
                        <td>${item.capacity}</td>
                        <td>$${parseFloat(item.price_per_day).toFixed(2)}</td>
                        <td>${item.is_featured ? '<span class="badge bg-success">Yes</span>' : '<span class="badge bg-secondary">No</span>'}</td>
                        <td>${item.display_order}</td>
                        <td>
                            <button class="btn btn-sm btn-glass me-1" onclick="App.editFleet(${item.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="App.confirmDeleteFleet(${item.id})">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }
        }).join('');
    }
    
    /**
     * Handle add new item button
     */
    function handleAddNewItem() {
        const type = state.currentManagementType;
        if (type === 'services') {
            showServiceModal();
        } else if (type === 'destinations') {
            showDestinationModal();
        } else if (type === 'fleet') {
            showFleetModal();
        }
    }
    
    /**
     * Show service modal
     */
    function showServiceModal(id = null) {
        state.currentServiceId = id;
        const modal = new bootstrap.Modal(elements.serviceModal);
        
        if (id) {
            elements.serviceModalLabel.innerHTML = '<i class="bi bi-pencil me-2"></i>Edit Service';
            loadService(id);
        } else {
            elements.serviceModalLabel.innerHTML = '<i class="bi bi-plus-lg me-2"></i>New Service';
            resetServiceForm();
        }
        
        modal.show();
    }
    
    /**
     * Show destination modal
     */
    function showDestinationModal(id = null) {
        state.currentDestinationId = id;
        const modal = new bootstrap.Modal(elements.destinationModal);
        
        if (id) {
            elements.destinationModalLabel.innerHTML = '<i class="bi bi-pencil me-2"></i>Edit Destination';
            loadDestination(id);
        } else {
            elements.destinationModalLabel.innerHTML = '<i class="bi bi-plus-lg me-2"></i>New Destination';
            resetDestinationForm();
        }
        
        modal.show();
    }
    
    /**
     * Show fleet modal
     */
    function showFleetModal(id = null) {
        state.currentFleetId = id;
        const modal = new bootstrap.Modal(elements.fleetModal);
        
        if (id) {
            elements.fleetModalLabel.innerHTML = '<i class="bi bi-pencil me-2"></i>Edit Fleet Vehicle';
            loadFleetVehicle(id);
        } else {
            elements.fleetModalLabel.innerHTML = '<i class="bi bi-plus-lg me-2"></i>New Fleet Vehicle';
            resetFleetForm();
        }
        
        modal.show();
    }
    
    /**
     * Load service data
     */
    async function loadService(id) {
        try {
            const response = await API.fetchService(id);
            const service = response.data;
            
            elements.serviceId.value = service.id;
            document.getElementById('serviceType').value = service.service_type;
            document.getElementById('serviceName').value = service.name || '';
            document.getElementById('serviceDescription').value = service.description || '';
            document.getElementById('serviceIcon').value = service.icon_class || '';
            document.getElementById('serviceDisplayOrder').value = service.display_order || 0;
            document.getElementById('serviceBenefits').value = Array.isArray(service.benefits) 
                ? service.benefits.join('\n') 
                : (service.benefits || '');
            document.getElementById('serviceImageUrl').value = service.image_url || '';
            document.getElementById('serviceIsActive').checked = service.is_active !== false;
            
            if (service.image_url) {
                document.getElementById('serviceImagePreview').innerHTML = 
                    `<img src="${service.image_url}" class="img-thumbnail" style="max-width: 200px;">`;
            }
        } catch (error) {
            showToast('Failed to load service', 'error');
            console.error('Error loading service:', error);
        }
    }
    
    /**
     * Load destination data
     */
    async function loadDestination(id) {
        try {
            const response = await API.fetchDestination(id);
            const destination = response.data;
            
            elements.destinationId.value = destination.id;
            document.getElementById('destinationName').value = destination.name || '';
            document.getElementById('destinationDescription').value = destination.description || '';
            document.getElementById('destinationDuration').value = destination.duration_hours || '';
            document.getElementById('destinationCapacity').value = destination.max_capacity || '';
            document.getElementById('destinationDisplayOrder').value = destination.display_order || 0;
            document.getElementById('destinationImageUrl').value = destination.image_url || '';
            document.getElementById('destinationIsFeatured').checked = destination.is_featured === true;
            
            if (destination.image_url) {
                document.getElementById('destinationImagePreview').innerHTML = 
                    `<img src="${destination.image_url}" class="img-thumbnail" style="max-width: 200px;">`;
            }
        } catch (error) {
            showToast('Failed to load destination', 'error');
            console.error('Error loading destination:', error);
        }
    }
    
    /**
     * Load fleet vehicle data
     */
    async function loadFleetVehicle(id) {
        try {
            const response = await API.fetchFleetVehicle(id);
            const vehicle = response.data;
            
            elements.fleetId.value = vehicle.id;
            document.getElementById('fleetVehicleType').value = vehicle.vehicle_type || '';
            document.getElementById('fleetDescription').value = vehicle.description || '';
            document.getElementById('fleetCapacity').value = vehicle.capacity || '';
            document.getElementById('fleetPrice').value = vehicle.price_per_day || '';
            document.getElementById('fleetDisplayOrder').value = vehicle.display_order || 0;
            document.getElementById('fleetFeatures').value = Array.isArray(vehicle.features) 
                ? vehicle.features.join('\n') 
                : (vehicle.features || '');
            document.getElementById('fleetImageUrl').value = vehicle.image_url || '';
            document.getElementById('fleetIsFeatured').checked = vehicle.is_featured === true;
            
            if (vehicle.image_url) {
                document.getElementById('fleetImagePreview').innerHTML = 
                    `<img src="${vehicle.image_url}" class="img-thumbnail" style="max-width: 200px;">`;
            }
        } catch (error) {
            showToast('Failed to load fleet vehicle', 'error');
            console.error('Error loading fleet vehicle:', error);
        }
    }
    
    /**
     * Handle service form submit
     */
    async function handleServiceSubmit() {
        try {
            const benefits = document.getElementById('serviceBenefits').value
                .split('\n')
                .map(b => b.trim())
                .filter(b => b.length > 0);
            
            const data = {
                service_type: document.getElementById('serviceType').value,
                name: document.getElementById('serviceName').value,
                description: document.getElementById('serviceDescription').value,
                icon_class: document.getElementById('serviceIcon').value,
                benefits: benefits,
                image_url: document.getElementById('serviceImageUrl').value,
                is_active: document.getElementById('serviceIsActive').checked,
                display_order: parseInt(document.getElementById('serviceDisplayOrder').value) || 0
            };
            
            if (!data.service_type || !data.name) {
                showToast('Please fill in required fields', 'error');
                return;
            }
            
            setLoading(true);
            
            if (state.currentServiceId) {
                await API.updateService(state.currentServiceId, data);
                showToast('Service updated successfully', 'success');
            } else {
                await API.createService(data);
                showToast('Service created successfully', 'success');
            }
            
            const modal = bootstrap.Modal.getInstance(elements.serviceModal);
            modal.hide();
            
            // Refresh management table
            await showManagementTable('services');
        } catch (error) {
            showToast(error.message || 'Failed to save service', 'error');
            console.error('Error saving service:', error);
        } finally {
            setLoading(false);
        }
    }
    
    /**
     * Handle destination form submit
     */
    async function handleDestinationSubmit() {
        try {
            const data = {
                name: document.getElementById('destinationName').value,
                description: document.getElementById('destinationDescription').value,
                duration_hours: parseInt(document.getElementById('destinationDuration').value),
                max_capacity: parseInt(document.getElementById('destinationCapacity').value),
                image_url: document.getElementById('destinationImageUrl').value,
                is_featured: document.getElementById('destinationIsFeatured').checked,
                display_order: parseInt(document.getElementById('destinationDisplayOrder').value) || 0
            };
            
            if (!data.name || !data.duration_hours || !data.max_capacity) {
                showToast('Please fill in required fields', 'error');
                return;
            }
            
            setLoading(true);
            
            if (state.currentDestinationId) {
                await API.updateDestination(state.currentDestinationId, data);
                showToast('Destination updated successfully', 'success');
            } else {
                await API.createDestination(data);
                showToast('Destination created successfully', 'success');
            }
            
            const modal = bootstrap.Modal.getInstance(elements.destinationModal);
            modal.hide();
            
            // Refresh management table
            await showManagementTable('destinations');
        } catch (error) {
            showToast(error.message || 'Failed to save destination', 'error');
            console.error('Error saving destination:', error);
        } finally {
            setLoading(false);
        }
    }
    
    /**
     * Handle fleet form submit
     */
    async function handleFleetSubmit() {
        try {
            const features = document.getElementById('fleetFeatures').value
                .split('\n')
                .map(f => f.trim())
                .filter(f => f.length > 0);
            
            const data = {
                vehicle_type: document.getElementById('fleetVehicleType').value,
                description: document.getElementById('fleetDescription').value,
                capacity: parseInt(document.getElementById('fleetCapacity').value),
                price_per_day: parseFloat(document.getElementById('fleetPrice').value),
                features: features,
                image_url: document.getElementById('fleetImageUrl').value,
                is_featured: document.getElementById('fleetIsFeatured').checked,
                display_order: parseInt(document.getElementById('fleetDisplayOrder').value) || 0
            };
            
            if (!data.vehicle_type || !data.capacity || !data.price_per_day) {
                showToast('Please fill in required fields', 'error');
                return;
            }
            
            setLoading(true);
            
            if (state.currentFleetId) {
                await API.updateFleet(state.currentFleetId, data);
                showToast('Fleet vehicle updated successfully', 'success');
            } else {
                await API.createFleet(data);
                showToast('Fleet vehicle created successfully', 'success');
            }
            
            const modal = bootstrap.Modal.getInstance(elements.fleetModal);
            modal.hide();
            
            // Refresh management table
            await showManagementTable('fleet');
        } catch (error) {
            showToast(error.message || 'Failed to save fleet vehicle', 'error');
            console.error('Error saving fleet vehicle:', error);
        } finally {
            setLoading(false);
        }
    }
    
    /**
     * Handle image upload
     */
    async function handleImageUpload(event, type, urlInputId, previewId) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            setLoading(true);
            const response = await API.uploadImage(file, type);
            document.getElementById(urlInputId).value = response.data.path;
            document.getElementById(previewId).innerHTML = 
                `<img src="${response.data.url}" class="img-thumbnail" style="max-width: 200px;">`;
            showToast('Image uploaded successfully', 'success');
        } catch (error) {
            showToast('Failed to upload image', 'error');
            console.error('Image upload error:', error);
        } finally {
            setLoading(false);
        }
    }
    
    /**
     * Reset service form
     */
    function resetServiceForm() {
        elements.serviceForm.reset();
        elements.serviceId.value = '';
        state.currentServiceId = null;
        document.getElementById('serviceImagePreview').innerHTML = '';
    }
    
    /**
     * Reset destination form
     */
    function resetDestinationForm() {
        elements.destinationForm.reset();
        elements.destinationId.value = '';
        state.currentDestinationId = null;
        document.getElementById('destinationImagePreview').innerHTML = '';
    }
    
    /**
     * Reset fleet form
     */
    function resetFleetForm() {
        elements.fleetForm.reset();
        elements.fleetId.value = '';
        state.currentFleetId = null;
        document.getElementById('fleetImagePreview').innerHTML = '';
    }
    
    /**
     * Confirm delete service
     */
    async function confirmDeleteService(id) {
        if (!confirm('Are you sure you want to delete this service?')) return;
        
        try {
            setLoading(true);
            await API.deleteService(id);
            showToast('Service deleted successfully', 'success');
            await showManagementTable('services');
        } catch (error) {
            showToast('Failed to delete service', 'error');
            console.error('Error deleting service:', error);
        } finally {
            setLoading(false);
        }
    }
    
    /**
     * Confirm delete destination
     */
    async function confirmDeleteDestination(id) {
        if (!confirm('Are you sure you want to delete this destination?')) return;
        
        try {
            setLoading(true);
            await API.deleteDestination(id);
            showToast('Destination deleted successfully', 'success');
            await showManagementTable('destinations');
        } catch (error) {
            showToast('Failed to delete destination', 'error');
            console.error('Error deleting destination:', error);
        } finally {
            setLoading(false);
        }
    }
    
    /**
     * Confirm delete fleet
     */
    async function confirmDeleteFleet(id) {
        if (!confirm('Are you sure you want to delete this fleet vehicle?')) return;
        
        try {
            setLoading(true);
            await API.deleteFleet(id);
            showToast('Fleet vehicle deleted successfully', 'success');
            await showManagementTable('fleet');
        } catch (error) {
            showToast('Failed to delete fleet vehicle', 'error');
            console.error('Error deleting fleet vehicle:', error);
        } finally {
            setLoading(false);
        }
    }
    
    // =========================================
    // PUBLIC API
    // =========================================
    
    return {
        init,
        editBooking: showBookingModal,
        confirmDelete,
        editTour: showTourModal,
        confirmDeleteTour,
        editCustomer: showCustomerModal,
        confirmDeleteCustomer,
        editService: showServiceModal,
        confirmDeleteService,
        editDestination: showDestinationModal,
        confirmDeleteDestination,
        editFleet: showFleetModal,
        confirmDeleteFleet,
        showToast,
        goToPage,
        goToPrevPage,
        goToNextPage
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', App.init);

