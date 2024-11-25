const canvasSketch = require('canvas-sketch');
const random = require('canvas-sketch-util/random');
const math = require('canvas-sketch-util/math');
const Tweakpane = require('tweakpane');  // Asegúrate de que esta línea esté al inicio

// Configuración de la animación
const settings = {
  dimensions: [1080, 1080],
  animate: true,
};

// Definir un objeto que contenga las variables que se actualizarán desde la GUI
const params = {
  numAgents: 40,
  agentSpeed: 0.1,
  lineThickness: 10,
  frequencyMultiplier: 0.1
};

// Crear el panel de Tweakpane para ajustar estas variables
const pane = new Tweakpane.Pane();
pane.addInput(params, 'numAgents', { min: 10, max: 100, step: 1 });
pane.addInput(params, 'agentSpeed', { min: 0.1, max: 1, step: 0.1 });
pane.addInput(params, 'lineThickness', { min: 1, max: 10, step: 0.1 });
//pane.addInput(params, 'frequencyMultiplier', { min: 0.01, max: 0.5, step: 0.01 });

let agents = []; // Variable para almacenar los agentes

const sketch = ({ context, width, height }) => {
  // Función para crear los agentes
  const createAgents = () => {
    agents = []; // Limpiar la lista de agentes
    for (let i = 0; i < params.numAgents; i++) {
      const x = random.range(0, width);
      const y = random.range(0, height);
      agents.push(new Agent(x, y));
    }
  };

  // Llamar a createAgents inicialmente
  createAgents();

  // Función para actualizar la animación
  return ({ context, width, height }) => {
    context.fillStyle = 'black';
    context.fillRect(0, 0, width, height);

    // Si el número de agentes cambia, recrearlos
    if (agents.length !== params.numAgents) {
      createAgents();
    }

    // Aquí obtendremos los datos de audio (usando el mismo código que antes)
    analyser.getByteFrequencyData(dataArray);
    
    // Aquí puedes ajustar el comportamiento de los agentes basado en los datos de audio
    const averageFrequency = getAverageFrequency(dataArray);

    // Dibujar las líneas entre los agentes
    agents.forEach((agent, i) => {
      for (let j = i + 1; j < agents.length; j++) {
        const other = agents[j];
        const dist = agent.pos.getDistance(other.pos);

        if (dist > 500) continue;

        // Ajuste del grosor de la línea basado en la frecuencia promedio
        context.lineWidth = math.mapRange(dist, 0, 200, params.lineThickness, 2) * (averageFrequency / 128);

        // Asegurarnos de que el color de la línea sea visible (blanco)
        context.strokeStyle = 'white';  // Establecemos un color visible para las líneas

        context.beginPath();
        context.moveTo(agent.pos.x, agent.pos.y);
        context.lineTo(other.pos.x, other.pos.y);
        context.stroke();
      }
    });

    // Actualizar y dibujar los agentes
    agents.forEach(agent => {
      agent.update(averageFrequency, params.agentSpeed);  // Cambiar la velocidad de los agentes según la frecuencia promedio
      agent.draw(context);
      agent.bounce(width, height);
    });
  };
};

// Inicializar Web Audio API
function initAudio() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;  // Tamaño del FFT (más grande = más datos de frecuencia)

  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  // Crear una fuente de audio (puede ser un archivo o entrada del micrófono)
  const audioElement = new Audio('audios/audio1.mp3');
  audioElement.loop = true;  // Repetir el audio
  const audioSourceNode = audioContext.createMediaElementSource(audioElement);
  audioSourceNode.connect(analyser);
  analyser.connect(audioContext.destination);

  audioElement.play();
}

// Obtener la frecuencia promedio
function getAverageFrequency(dataArray) {
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    sum += dataArray[i];
  }
  return sum / dataArray.length;
}

canvasSketch(sketch, settings);

// Clase para los agentes
class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  getDistance(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

class Agent {
  constructor(x, y) {
    this.pos = new Vector(x, y);
    this.vel = new Vector(random.range(-1, 1), random.range(-1, 1));
    this.radius = random.range(3, 8);
  }

  bounce(width, height) {
    if (this.pos.x <= 0 || this.pos.x >= width)  this.vel.x *= -1;
    if (this.pos.y <= 0 || this.pos.y >= height) this.vel.y *= -1;
  }

  update(averageFrequency, agentSpeed) {
    // Modificar la velocidad y el tamaño del agente según la frecuencia promedio del audio
    this.pos.x += this.vel.x * averageFrequency * agentSpeed;  // Escalar el movimiento según la frecuencia
    this.pos.y += this.vel.y * averageFrequency * agentSpeed;
    this.radius = random.range(3, 8) + averageFrequency * 0.05;  // Cambiar el tamaño basado en la frecuencia
  }

  draw(context) {
    context.save();
    context.translate(this.pos.x, this.pos.y);
    context.lineWidth = 1;

    context.beginPath();
    context.arc(0, 0, this.radius, 0, Math.PI * 2);
    context.fillStyle = 'white';
    context.fill();
    context.stroke();

    context.restore();
  }
}

// Iniciar el audio al cargar la página
initAudio();
