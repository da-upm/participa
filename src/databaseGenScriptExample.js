const database = 'participa';
const collectionList = [
    'users',
    'candidates',
    'commitments',
    'proposals',
    'questions',
    'sessions'
]

use(database);

db.createUser({
    user: 'user',
    pwd: 'password',
    roles: [
        {
            role: 'readWrite',
            db: database
        }
    ]
});

collectionList.forEach(collection => {
    db.createCollection(collection);
});

db.parameters.insert({
    _id: ObjectId('6726ce49c8b45bdd85cf64e8'),
    candidates: {
        'test': 'test',
    },
    categories: {
        general: 'General',
        economic: 'Financiación',
        infraestructures: 'Infraestructuras',
        promotioon: 'Comunicación y promoción',
        transport: 'Transporte',
        services: 'Servicios',
        students: 'Estudiantes',
        unilife: 'Asociaciones y vida universitaria',
        scolarships: 'Ayudas y becas estudiantes',
        docentia: 'Docencia - Educación',
        equality: 'Igualdad y dimensión social',
        studentcouncil: 'Representación estudiantil',
        pdi: 'PDI',
        aid: 'Ayudas a PDI',
        phd: 'Doctorado',
        research: 'Investigación',
        position: 'Plazas PDI',
        ptgas: 'PTGAS',
        aidptgas: 'Ayudas a PTGAS',
        staff: 'Personal Funcionario',
        laboral: 'Personal Laboral',
        rpt: 'Plazas y RPT PTGAS'
    },
    affiliationCodes: {
        pdi: [
            'D',
            'M',
            'U',
            'P',
            'R',
            'B'
        ],
        student: [
            'A',
            'W'
        ],
        ptgas: [
            'F',
            'L',
            'S'
        ]
    },
    affiliations: {
        pdi: 'PDI',
        student: 'Estudiantes',
        ptgas: 'PTGAS',
        none: 'Otros'
    },
    centres: {
        '1': 'ETSIA',
        '3': 'ETSAM',
        '4': 'ETSICCP',
        '5': 'ETSII',
        '6': 'ETSIME',
        '8': 'ETSIN',
        '9': 'ETSIT',
        '10': 'ETSIINF',
        '11': 'INEF',
        '12': 'ETSITGC',
        '13': 'ETSIMFMN',
        '14': 'ETSIAE',
        '20': 'ETSIAAB',
        '30': 'EPES',
        '54': 'ETSEM',
        '56': 'ETSIDI',
        '58': 'ETSIC',
        '59': 'ETSIST',
        '61': 'ETSISI',
        '81': 'CSDMM',
        '90': 'Rectorado',
        '91': 'ICE',
        '97': 'IDR'
    },
    colors: {
        primary: '#00509b',
        secondary: '#ffffff',
    },
    text: {
        headerTitle: 'Propuestas para el Rector/a',
        headerSubtitle: 'Comparte tus ideas para la mejora de nuestra universidad.',
        delegationName: 'Delegación de Alumnos UPM',
        phoneNumber: '91 067 06 28',
        email: 'da@upm.es',
        web: 'da.upm.es',
        emailElections: 'da.elecciones@upm.es',
    },
    socialMedia: [
        {
            icon: 'bi bi-twitter-x',
            name: '@Delegacion_UPM',
            link: 'https://twitter.com/Delegacion_UPM'
        },
        {
            icon: 'bi bi-instagram',
            name: '@delegacionupm',
            link: 'https://www.instagram.com/delegacionupm/'
        },
        {
            icon: 'bi bi-youtube',
            name: 'Delegación de Alumnos UPM',
            link: 'https://www.youtube.com/channel/UCwhhsM-aaZ4bg_Mk_Vjzg0A'
        }
    ]
      
});
