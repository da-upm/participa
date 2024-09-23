$(document).ready(function() {
    // Array de propuestas (debe coincidir con el array en la página principal)
    let proposals = [
        {
            title: 'Mejora de laboratorios',
            description: 'Actualizar el equipamiento de los laboratorios de ingeniería para que los estudiantes tengan acceso a la última tecnología en el campo.',
            category: 'Infraestructura',
            supports: 50,
            supportingCandidates: 5
        },
        {
            title: 'Aumento de becas para estudiantes',
            description: 'Incrementar el número de becas disponibles para los estudiantes con buen rendimiento académico y bajos recursos económicos.',
            category: 'Educación',
            supports: 75,
            supportingCandidates: 8
        },
        {
            title: 'Creación de áreas verdes',
            description: 'Desarrollar nuevas áreas verdes y espacios de descanso en el campus para mejorar la calidad de vida de los estudiantes y el personal.',
            category: 'Infraestructura',
            supports: 40,
            supportingCandidates: 3
        }
    ];

    // Renderizar propuestas en la tabla de administración
    function renderAdminProposals(filteredProposals = proposals) {
        let tableBody = $('#adminProposalsTableBody');
        tableBody.empty();

        filteredProposals.forEach((proposal, index) => {
            let rowHtml = `
                <tr>
                    <td><input type="checkbox" class="form-check-input" data-index="${index}"></td>
                    <td>${proposal.title}</td>
                    <td class="category-column">${proposal.category}</td>
                    <td class="actions-column">
                        <button class="btn btn-link view-more" data-index="${index}">Ver más</button>
                    </td>
                </tr>`;
            tableBody.append(rowHtml);
        });

        // Añadir evento click para los botones "Ver más"
        $('.view-more').on('click', function() {
            let proposalIndex = $(this).data('index');
            showAdminProposalDetails(proposalIndex);
        });
    }

    // Mostrar detalles de la propuesta en el modal
    function showAdminProposalDetails(index) {
        let proposal = proposals[index];
        $('#adminProposalTitle').text(proposal.title);
        $('#adminProposalCategory').text(proposal.category);
        $('#adminProposalDescription').text(proposal.description);
        $('#adminProposalSupports').text(proposal.supports);
        $('#adminProposalSupportingCandidates').text(proposal.supportingCandidates);

        // Mostrar el modal
        $('#adminProposalDetailModal').modal('show');
    }

    // Filtrar y buscar propuestas
    function filterAdminProposals() {
        let searchInput = $('#adminSearchInput').val().toLowerCase();
        let selectedCategory = $('#adminFilterCategory').val();

        let filteredProposals = proposals.filter(proposal => {
            let matchesCategory = selectedCategory ? proposal.category === selectedCategory : true;
            let matchesSearch = proposal.title.toLowerCase().includes(searchInput) ||
                                proposal.description.toLowerCase().includes(searchInput);
            return matchesCategory && matchesSearch;
        });

        renderAdminProposals(filteredProposals);
    }

    // Limpiar filtros y búsqueda
    $('#adminClearFilters').on('click', function() {
        $('#adminSearchInput').val('');
        $('#adminFilterCategory').val('');
        renderAdminProposals();
    });

    // Escuchar eventos de búsqueda y filtro
    $('#adminSearchInput').on('input', filterAdminProposals);
    $('#adminFilterCategory').on('change', filterAdminProposals);

    // Generar nueva propuesta a partir de las seleccionadas
    $('#generateNewProposal').on('click', function() {
        let selectedIndexes = $('.form-check-input:checked').map(function() {
            return $(this).data('index');
        }).get();

        if (selectedIndexes.length === 0) {
            alert('Por favor, selecciona al menos una propuesta.');
            return;
        }

        // Prepara la información para el modal
        let combinedTitle = selectedIndexes.map(index => proposals[index].title).join(' / ');
        let combinedDescription = selectedIndexes.map(index => proposals[index].description).join('\n\n');

        $('#newProposalTitle').val(combinedTitle);
        $('#newProposalDescription').val(combinedDescription);
        $('#newProposalCategory').val(selectedIndexes.map(index => proposals[index].category)[0]);

        // Mostrar el modal para crear una nueva propuesta
        $('#createProposalModal').modal('show');
    });

    // Enviar el formulario para crear una nueva propuesta
    $('#createProposalForm').on('submit', function(event) {
        event.preventDefault();
        let newProposal = {
            title: $('#newProposalTitle').val(),
            description: $('#newProposalDescription').val(),
            category: $('#newProposalCategory').val(),
            supports: 0,
            supportingCandidates: 0
        };
        proposals.push(newProposal);
        renderAdminProposals();
        $('#createProposalModal').modal('hide');
    });

    // Renderizar propuestas iniciales
    renderAdminProposals();
});
