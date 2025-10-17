// src/pages/DicomViewer.tsx

interface Study {
  ID: string;
  MainDicomTags: {
    StudyDescription: string;
    StudyDate: string;
    PatientName: string;
    PatientID: string;
    PatientBirthDate: string;
    AccessionNumber: string;
    StudyInstanceUID: string;
  };
}

// O componente agora recebe a URL do viewer pronta
interface DicomViewerProps {
  study: Study;
  viewerUrl: string; // <-- A URL final é passada como prop
  onClose: () => void;
}

export default function DicomViewer({ study, viewerUrl, onClose }: DicomViewerProps) {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="bg-gray-800 p-4 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold">Visualizador de Exames</h1>
        <button
          onClick={onClose}
          className="py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md font-bold transition duration-300"
        >
          Procurar Outro Exame
        </button>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <aside className="w-1/4 bg-gray-800 p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 border-b border-gray-600 pb-2">Detalhes do Estudo</h2>
          <div className="space-y-2 text-sm">
            <div>
              <label className="font-bold text-gray-400">Paciente:</label>
              <p>{study.MainDicomTags.PatientName}</p>
            </div>
            <div>
                <label className="font-bold text-gray-400">Data de Nascimento:</label>
                {/* Formatação básica da data */}
                <p>{study.MainDicomTags.PatientBirthDate.substring(6, 8)}/{study.MainDicomTags.PatientBirthDate.substring(4, 6)}/{study.MainDicomTags.PatientBirthDate.substring(0, 4)}</p>
            </div>
            <div>
              <label className="font-bold text-gray-400">Nº de Acesso:</label>
              <p>{study.MainDicomTags.AccessionNumber}</p>
            </div>
            <div>
              <label className="font-bold text-gray-400">Descrição do Exame:</label>
              <p>{study.MainDicomTags.StudyDescription}</p>
            </div>
            <div>
                <label className="font-bold text-gray-400">Data do Exame:</label>
                {/* Formatação básica da data */}
                <p>{study.MainDicomTags.StudyDate.substring(6, 8)}/{study.MainDicomTags.StudyDate.substring(4, 6)}/{study.MainDicomTags.StudyDate.substring(0, 4)}</p>
            </div>
          </div>
        </aside>

        <section className="flex-1 w-3/4 bg-black">
          {viewerUrl ? (
            <iframe
              src={viewerUrl}
              className="w-full h-full border-none"
              title="Visualizador DICOM"
            />
          ) : (
            <p className="text-center mt-10">A carregar visualizador...</p>
          )}
        </section>
      </main>
    </div>
  );
}
