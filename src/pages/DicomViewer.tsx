// src/pages/DicomViewer.tsx
import { useEffect, useState } from 'react';

// Certifique-se de que esta interface corresponde à do AcessoRapido.tsx
interface Study {
  ID: string;
  MainDicomTags: {
    StudyDescription: string;
    StudyDate: string;
    PatientName: string;
    PatientID: string;
    PatientBirthDate: string;
    AccessionNumber: string;
    StudyInstanceUID: string; // <-- Certifique-se de que esta linha está aqui
  };
}

interface DicomViewerProps {
  study: Study;
  onClose: () => void;
}

export default function DicomViewer({ study, onClose }: DicomViewerProps) {
  const [viewerUrl, setViewerUrl] = useState('');

useEffect(() => {
  const publicOrthancUrl = 'https://orthanc.kemax.com.br'; 

  const studyInstanceUID = study.MainDicomTags.StudyInstanceUID;

  setViewerUrl(`${publicOrthancUrl}/stone-webviewer/index.html?study=${studyInstanceUID}`);

}, [study]);
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
        {/* Barra Lateral Esquerda (Leftbar) */}
        <aside className="w-1/4 bg-gray-800 p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 border-b border-gray-600 pb-2">Detalhes do Estudo</h2>
          <div className="space-y-2 text-sm">
            <div>
              <label className="font-bold text-gray-400">Paciente:</label>
              <p>{study.MainDicomTags.PatientName}</p>
            </div>
            <div>
              <label className="font-bold text-gray-400">Data de Nascimento:</label>
              <p>{study.MainDicomTags.PatientBirthDate}</p>
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
              <p>{study.MainDicomTags.StudyDate}</p>
            </div>
             <div>
              <label className="font-bold text-gray-400">ID do Estudo (DICOM):</label>
              <p className="break-all">{study.MainDicomTags.StudyInstanceUID}</p>
            </div>
          </div>
        </aside>

        {/* Área Principal com o iframe */}
        <section className="flex-1 w-3/4 bg-black">
          {viewerUrl ? (
            <iframe
              src={viewerUrl}
              className="w-full h-full border-none"
              title="OHIF DICOM Viewer"
            />
          ) : (
            <p>A carregar visualizador...</p>
          )}
        </section>
      </main>
    </div>
  );
}