// Importar solo las librerías necesarias
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// Importar solo los iconos que realmente se usan en la aplicación
import {
  // Iconos de navegación y interfaz
  faChevronLeft,
  faChevronRight,
  faChevronDown,
  faAngleDoubleLeft,
  faAngleDoubleRight,
  faTimes,
  faPlus,
  faEdit,
  faEye,
  faTrash,
  faSave,
  faSync,
  faSyncAlt,
  
  // Iconos de utilidades
  faUser,
  faUsers,
  faUserTie,
  faIdCard,
  faBuilding,
  faIndustry,
  faMapMarkerAlt,
  faTag,
  faCogs,
  faSearch,
  faSort,
  faSortUp,
  faSortDown,
  
  // Iconos de energía y servicios
  faBolt,
  faFire,
  faSolarPanel,
  faFileContract,
  faTools,
  faChartLine,
  faChartBar,
  
  // Iconos de documentos
  faFileExcel,
  faFilePdf,
  faFileAlt,
  faDownload,
  faPaperPlane,
  faStickyNote,
  
  // Iconos de estado
  faCircle,
  faCheckCircle,
  faExclamationTriangle,
  faExclamationCircle,
  faInfoCircle,
  
  // Iconos de calendario y tiempo
  faCalendarAlt,
  faHistory,
  faPlay,
  faStop,
  
  // Iconos de utilidades varias
  faHashtag,
  faCommentAlt,
  faSignOutAlt,
  faPlusCircle,
  faTasks
} from '@fortawesome/free-solid-svg-icons'

// Agregar iconos a la librería
library.add(
  // Navegación
  faChevronLeft,
  faChevronRight,
  faChevronDown,
  faAngleDoubleLeft,
  faAngleDoubleRight,
  faTimes,
  faPlus,
  faEdit,
  faEye,
  faTrash,
  faSave,
  faSync,
  faSyncAlt,
  
  // Usuarios y entidades
  faUser,
  faUsers,
  faUserTie,
  faIdCard,
  faBuilding,
  faIndustry,
  faMapMarkerAlt,
  faTag,
  faCogs,
  faSearch,
  faSort,
  faSortUp,
  faSortDown,
  
  // Energía
  faBolt,
  faFire,
  faSolarPanel,
  faFileContract,
  faTools,
  faChartLine,
  faChartBar,
  
  // Documentos
  faFileExcel,
  faFilePdf,
  faFileAlt,
  faDownload,
  faPaperPlane,
  faStickyNote,
  
  // Estados
  faCircle,
  faCheckCircle,
  faExclamationTriangle,
  faExclamationCircle,
  faInfoCircle,
  
  // Tiempo
  faCalendarAlt,
  faHistory,
  faPlay,
  faStop,
  
  // Varios
  faHashtag,
  faCommentAlt,
  faSignOutAlt,
  faPlusCircle,
  faTasks
)

export { FontAwesomeIcon }
