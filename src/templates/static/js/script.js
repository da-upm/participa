$(document).ready(function() {
    // Renderizar propuestas
    function renderProposals(filteredProposals = proposals) {
        let container = $('#proposalsContainer');
        container.empty();
        
        filteredProposals.forEach((proposal, index) => {
            let cardHtml = `
                        <div class="col-lg-4 col-md-6">
                            <div class="card">
                                <div class="card-body">
                                    <h5 class="card-title">${proposal.title}</h5>
                                    <p class="card-text">${proposal.description.substring(0, 100)}...</p>
                                    <span class="badge bg-primary">${proposal.category}</span>
                                    <p class="mt-2">Apoyos: ${proposal.supports}</p>
                                    <p>Candidatos que apoyan: ${proposal.supportingCandidates}</p>
                                    <button class="btn btn-link view-more" data-index="${index}">Ver más</button>
                                    <button class="btn btn-success">Apoyar</button>
                                </div>
                            </div>
                        </div>`;
            container.append(cardHtml);
        });

        // Añadir evento click para los botones "Ver más"
        $('.view-more').on('click', function() {
            let proposalIndex = $(this).data('index');
            showProposalDetails(proposalIndex);
        });
    }

    // Mostrar detalles de la propuesta en el modal
    function showProposalDetails(index) {
        let proposal = proposals[index];
        $('#proposalTitle').text(proposal.title);
        $('#proposalCategory').text(proposal.category);
        $('#proposalDescription').text(proposal.description);
        $('#proposalSupports').text(proposal.supports);
        $('#proposalSupportingCandidates').text(proposal.supportingCandidates);

        // Mostrar el modal
        $('#proposalDetailModal').modal('show');
    }

    // Lógica de búsqueda y filtrado
    function filterProposals() {
        let searchInput = $('#searchInput').val().toLowerCase();
        let selectedCategory = $('#filterCategory').val();

        let filteredProposals = proposals.filter(proposal => {
            let matchesCategory = selectedCategory ? proposal.category === selectedCategory : true;
            let matchesSearch = proposal.title.toLowerCase().includes(searchInput) ||
                                proposal.description.toLowerCase().includes(searchInput);
            return matchesCategory && matchesSearch;
        });

        renderProposals(filteredProposals);
    }

    // Limpiar filtros y búsqueda
    $('#clearFilters').on('click', function() {
        $('#searchInput').val('');
        $('#filterCategory').val('');
        renderProposals();
    });

    // Escuchar eventos de búsqueda y filtro
    $('#searchInput').on('input', filterProposals);
    $('#filterCategory').on('change', filterProposals);

    // Escuchar envío del formulario de propuesta
    $('#proposalForm').on('submit', function(event) {
        event.preventDefault();
        let newProposal = {
            title: $('#title').val(),
            description: $('#description').val(),
            category: $('#category').val(),
            supports: 0,
            supportingCandidates: 0
        };
        proposals.push(newProposal);
        renderProposals();
        $('#proposalModal').modal('hide');
    });

    // Renderizar propuestas iniciales
    renderProposals();
});
