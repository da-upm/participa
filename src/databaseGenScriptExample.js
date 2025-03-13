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

db.candidates.insert({
    _id: ObjectId('67bb5178df6a7f70b73ce484'),
    name: 'Manolo',
    surname: 'Ruiz Sanz',
    email: 'manolo.ruizzz@correo.es',
    username: 'manolo.ruizzz',
    imageURL: "./img/Default.png",
    surrogateUsers: [],
    unsignedCommitmentsDoc: null,
    signedCommitmentsDoc: null,
    socialMedia: [
        {
            icon: 'globe',
            url: 'https://example.com/manolo',
            _id: ObjectId('67c0c10af96ae5a9d4ad68a1')
        },
        {
            icon: 'twitter',
            url: 'https://twitter.com/manolo',
            _id: ObjectId('67c0c10af96ae5a9d4ad68a2')
        },
        {
            icon: 'linkedin',
            url: 'https://linkedin.com/in/manolo',
            _id: ObjectId('67c0c10af96ae5a9d4ad68a3')
        },
        {
            icon: 'instagram',
            url: 'https://linkedin.com/in/manolo',
            _id: ObjectId('67c0c10af96ae5a9d4ad68a4')
        }
    ],
    details: {
        "Antigüedad en la UPM": "80 años",
        "Estudios": "Panadero por la UPM888",
        "Centro": "ETSIT888",
        "Departamento": "A saber: muchos, poc888os. Puede que no esé en ninguno",
        "Área de Conocimiento": "Sabe muchas cosas888",
        "Categoría Docente": "Holahola caracola88"
    },
    programUrl: "https://example.com/manolo/programazz",
    updatedAt: new Date("2025-02-27T19:46:18.298Z")
});

db.parameters.insert({
    _id: ObjectId('6726ce49c8b45bdd85cf64e8'),
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
        secondary: '#00509b',
        primaryButton: '#00509b',
        secondaryButton: '#00509b',
    },
    featureFlags: {
        'questions': true,
        'candidates': true,
        'process': true,
        'timeline': true
    },
    // schoolRestricted: 61, Only enable if you want to restrict the school to the number of the center.
    text: {
        pageTitle: 'Participa DA-UPM',
        headerTitle: 'Propuestas para el Rector/a',
        headerSubtitle: 'Comparte tus ideas para la mejora de nuestra universidad.',
        delegationName: 'Delegación de Alumnos UPM',
        phoneNumber: '91 067 06 28',
        email: 'da@upm.es',
        web: 'da.upm.es',
        emailElections: 'da.elecciones@upm.es',
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
    },
});

db.timelinesections.insert({
    _id: ObjectId(),
    dateRange: "1 - 10 JAN 2025",
    title: "Example Title",
    content: "<p>Example content goes here. You can include HTML as needed.</p>",
    buttons: [
        {
            text: "Example Button 1",
            url: "https://example.com/1",
            _id: ObjectId("EXAMPLE_BUTTON_ID_1") // Replace with a valid ObjectId
        },
        {
            text: "Example Button 2",
            url: "https://example.com/2",
            _id: ObjectId("EXAMPLE_BUTTON_ID_2") // Replace with a valid ObjectId
        }
    ],
    order: 1,                         
    createdAt: new Date("2025-01-01T00:00:00Z"), // Replace with your example date
    updatedAt: new Date("2025-01-01T00:00:00Z"), // Replace with your example date
});
