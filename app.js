// =============================================
// 🚀 VISUALIZADOR 3D - APP.JS
// =============================================

// Variáveis globais
let camera, scene, renderer, controls, currentModel;
let modelCenter = new THREE.Vector3();
let isWireframe = false;
let shadowsEnabled = true;

// Elementos da UI
let loadingElement, progressElement, statusElement, statsElement;
let uiVisible = true;
let isMobile = false;
let uiToggleElement, uiElement;

// =============================================
// 🎯 INICIALIZAÇÃO
// =============================================

function init() {
    console.log('🚀 Iniciando Visualizador 3D...');
    
    // Verificar bibliotecas
    if (typeof THREE === 'undefined') {
        showError('Three.js não carregado');
        return;
    }
    if (typeof JSZip === 'undefined') {
        showError('JSZip não carregado');
        return;
    }

    // Verificar loaders
    console.log('📦 Verificando loaders...');
    console.log('OBJLoader:', typeof THREE.OBJLoader);
    console.log('MTLLoader:', typeof THREE.MTLLoader);
    console.log('OrbitControls:', typeof THREE.OrbitControls);

    try {
        initScene();
        checkForModel();
        startRenderLoop();
        console.log('✅ Visualizador inicializado com sucesso');
    } catch (error) {
        console.error('💥 Erro na inicialização:', error);
        showError('Erro na inicialização: ' + error.message);
    }
}

function initScene() {
    // Inicializar elementos da UI
    loadingElement = document.getElementById('loading');
    progressElement = document.getElementById('progress');
    statusElement = document.getElementById('statusText');
    statsElement = document.getElementById('stats');

    // Inicializar controles de UI
    initUI();

    // Criar cena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a12);
    scene.fog = new THREE.Fog(0x0a0a12, 500, 3000);

    // Configurar câmera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);

    // Configurar renderizador
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Atualização para Three.js r128+
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('container').appendChild(renderer.domElement);

    // Configurar controles de órbita
    try {
        if (typeof THREE.OrbitControls !== 'undefined') {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
            console.log('✅ OrbitControls carregado via THREE.OrbitControls');
        } else {
            console.warn('⚠️ OrbitControls não encontrado, usando controles básicos');
            createBasicControls();
        }
    } catch (error) {
        console.warn('⚠️ Erro ao carregar OrbitControls, usando controles básicos:', error);
        createBasicControls();
    }
    
    if (controls) {
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.rotateSpeed = 0.5;
        controls.enablePan = true;
    }

    // Configurar iluminação
    setupLighting();

    // Configurar eventos
    setupEventListeners();

    updateStatus('✅ Sistema pronto');
    updateStats('Aguardando arquivo...');
}

// =============================================
// 🎮 CONTROLES DE UI E MOBILE
// =============================================

function initUI() {
    uiToggleElement = document.getElementById('uiToggle');
    uiElement = document.getElementById('ui');
    
    // Verificar se é mobile
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    
    // Configurar eventos
    uiToggleElement.addEventListener('click', toggleUI);
    
    // Ocultar automaticamente em mobile após alguns segundos
    if (isMobile) {
        setTimeout(() => {
            hideUI();
        }, 5000);
    }
    
    // Evento para mostrar UI temporariamente ao tocar na tela (mobile)
    if (isMobile) {
        let tapTimer;
        renderer.domElement.addEventListener('touchstart', (e) => {
            if (!uiVisible && e.touches.length === 1) {
                showUITemporarily();
            }
        });
    }
}

function toggleUI() {
    if (uiVisible) {
        hideUI();
    } else {
        showUI();
    }
}

function hideUI() {
    uiElement.classList.add('hidden');
    uiVisible = false;
    updateUIToggleButton();
    
    if (isMobile) {
        uiToggleElement.style.background = 'rgba(0, 0, 0, 0.6)';
    }
}

function showUI() {
    uiElement.classList.remove('hidden');
    uiVisible = true;
    updateUIToggleButton();
    
    if (isMobile) {
        uiToggleElement.style.background = 'rgba(0, 0, 0, 0.8)';
        
        // Ocultar automaticamente após 5 segundos em mobile
        setTimeout(() => {
            if (uiVisible) {
                hideUI();
            }
        }, 5000);
    }
}

function showUITemporarily() {
    if (!uiVisible) {
        showUI();
        
        // Manter visível por mais tempo quando ativado por toque
        setTimeout(() => {
            if (uiVisible) {
                hideUI();
            }
        }, 8000);
    }
}

function updateUIToggleButton() {
    if (uiVisible) {
        uiToggleElement.innerHTML = '✕';
        uiToggleElement.title = 'Ocultar Menu';
    } else {
        uiToggleElement.innerHTML = '☰';
        uiToggleElement.title = 'Mostrar Menu';
    }
}

// Detectar redimensionamento para mobile/desktop
function handleResize() {
    const wasMobile = isMobile;
    isMobile = window.innerWidth <= 768;
    
    // Se mudou de desktop para mobile, ocultar UI
    if (!wasMobile && isMobile && uiVisible) {
        setTimeout(() => {
            hideUI();
        }, 3000);
    }
    
    // Se mudou de mobile para desktop, mostrar UI
    if (wasMobile && !isMobile && !uiVisible) {
        showUI();
    }
}

// Função fallback para quando OrbitControls não está disponível
function createBasicControls() {
    console.log('🔄 Criando controles básicos...');
    
    // Controles básicos de mouse
    let isMouseDown = false;
    let previousMousePosition = { x: 0, y: 0 };
    const rendererDom = renderer.domElement;

    rendererDom.addEventListener('mousedown', (e) => {
        isMouseDown = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    rendererDom.addEventListener('mousemove', (e) => {
        if (!isMouseDown) return;

        const deltaMove = {
            x: e.clientX - previousMousePosition.x,
            y: e.clientY - previousMousePosition.y
        };

        // Rotação da câmera
        camera.position.x -= deltaMove.x * 0.01;
        camera.position.y += deltaMove.y * 0.01;
        camera.lookAt(scene.position);

        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    rendererDom.addEventListener('mouseup', () => {
        isMouseDown = false;
    });

    rendererDom.addEventListener('wheel', (e) => {
        // Zoom com roda do mouse
        e.preventDefault();
        camera.position.z += e.deltaY * 0.01;
    });

    // Simular interface do OrbitControls para compatibilidade
    controls = {
        enableDamping: false,
        dampingFactor: 0.05,
        rotateSpeed: 0.5,
        enablePan: true,
        target: new THREE.Vector3(0, 0, 0),
        update: function() {
            // Função vazia para compatibilidade
        },
        dispose: function() {
            // Função vazia para compatibilidade
        }
    };

    updateStatus('⚠️ Usando controles básicos (Arraste: Rotacionar, Roda: Zoom)');
}

function setupLighting() {
    // Luz ambiente
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Luz direcional principal
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(10, 20, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    scene.add(mainLight);

    // Luz de preenchimento
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-10, 10, -10);
    scene.add(fillLight);
}

function setupEventListeners() {
    // Redimensionamento da janela
    window.addEventListener('resize', () => {
        onWindowResize();
        handleResize();
    });

    // Controles de teclado
    document.addEventListener('keydown', onKeyDown);
    
    // Tecla 'H' para mostrar/ocultar UI
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'h') {
            toggleUI();
        }
    });
}

// =============================================
// 🎮 CONTROLES E INTERAÇÃO
// =============================================

function resetCamera() {
    if (currentModel && modelCenter) {
        const box = new THREE.Box3().setFromObject(currentModel);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 0.5;

        camera.position.copy(modelCenter).add(new THREE.Vector3(distance, distance * 0.5, distance));
        camera.lookAt(modelCenter);
        
        if (controls && controls.target) {
            controls.target.copy(modelCenter);
            controls.update();
        }

        updateStatus('🎯 Câmera resetada');
    } else {
        camera.position.set(5, 5, 5);
        camera.lookAt(0, 0, 0);
        
        if (controls && controls.target) {
            controls.target.set(0, 0, 0);
            controls.update();
        }
        
        updateStatus('🎯 Câmera na posição inicial');
    }
}

function toggleWireframe() {
    isWireframe = !isWireframe;
    
    if (currentModel) {
        currentModel.traverse((child) => {
            if (child.isMesh) {
                child.material.wireframe = isWireframe;
            }
        });
    }
    
    updateStatus(isWireframe ? '📐 Modo wireframe ativo' : '🎨 Modo sólido ativo');
}

function toggleShadows() {
    shadowsEnabled = !shadowsEnabled;
    renderer.shadowMap.enabled = shadowsEnabled;
    
    if (currentModel) {
        currentModel.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = shadowsEnabled;
                child.receiveShadow = shadowsEnabled;
            }
        });
    }
    
    updateStatus(shadowsEnabled ? '🌑 Sombras ativas' : '🌞 Sombras desativadas');
}

function disposeScene() {
    if (currentModel) {
        scene.remove(currentModel);
        
        // Limpar recursos
        currentModel.traverse((child) => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            }
        });
        
        currentModel = null;
    }
    
    updateStatus('🗑️ Cena limpa');
    updateStats('Pronto para novo modelo');
}

// =============================================
// 📦 CARREGAMENTO DE MODELOS
// =============================================

function checkForModel() {
    const fileUrl = getURLParameter('file');
    if (fileUrl) {
        console.log('📦 URL do modelo encontrada:', fileUrl);
        loadModelFromURL(fileUrl);
    } else {
        console.log('ℹ️ Nenhum parâmetro file na URL');
        updateStatus('💡 Use: ?file=URL_DO_SEU_MODELO.zip');
    }
}

async function loadModelFromURL(fileUrl) {
    try {
        showLoading('📦 Baixando arquivo...');
        updateStatus('⬇️ Conectando com servidor...');

        console.log('🌐 Fazendo requisição para:', fileUrl);
        const response = await fetch(fileUrl);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
        }

        showLoading('📦 Processando ZIP...');
        updateStatus('🔧 Extraindo arquivos...');

        const zipData = await response.arrayBuffer();
        console.log('✅ ZIP baixado, tamanho:', zipData.byteLength, 'bytes');

        const zip = await JSZip.loadAsync(zipData);
        const files = Object.keys(zip.files);
        
        console.log('📁 Arquivos no ZIP:', files);

        // Encontrar arquivos OBJ e MTL
        const objFile = files.find(f => f.toLowerCase().endsWith('.obj'));
        const mtlFile = files.find(f => f.toLowerCase().endsWith('.mtl'));

        if (!objFile) throw new Error('Arquivo OBJ não encontrado no ZIP');
        if (!mtlFile) throw new Error('Arquivo MTL não encontrado no ZIP');

        console.log('🔍 Arquivos encontrados:', { obj: objFile, mtl: mtlFile });

        // Carregar modelo (com fallback se MTL falhar)
        await loadModelWithFallback(zip, objFile, mtlFile);

    } catch (error) {
        console.error('💥 Erro ao carregar modelo:', error);
        hideLoading();
        showError('Falha ao carregar: ' + error.message);
    }
}

async function loadModelWithFallback(zip, objFile, mtlFile) {
    try {
        // Primeiro tentar carregar com materiais
        showLoading('🎨 Carregando materiais...');
        updateStatus('⚙️ Processando MTL...');
        
        const materials = await loadMaterials(zip, mtlFile);
        
        // Carregar geometria com materiais
        showLoading('📐 Carregando geometria...');
        updateStatus('🔨 Construindo modelo...');
        
        const model = await loadGeometry(zip, objFile, materials);
        setupAndDisplayModel(model, 'com materiais');
        
    } catch (materialError) {
        console.warn('⚠️ Falha ao carregar materiais, tentando sem materiais:', materialError);
        
        // Fallback: carregar sem materiais
        try {
            showLoading('📐 Carregando geometria básica...');
            updateStatus('🔄 Usando fallback...');
            
            const model = await loadGeometry(zip, objFile, null);
            setupAndDisplayModel(model, 'sem materiais (fallback)');
            
        } catch (geometryError) {
            console.error('💥 Falha no fallback:', geometryError);
            throw new Error('Não foi possível carregar o modelo mesmo sem materiais');
        }
    }
}

async function loadMaterials(zip, mtlFile) {
    try {
        console.log('🔧 Iniciando carregamento de materiais...');
        
        const mtlContent = await zip.file(mtlFile).async('text');
        console.log('📝 Conteúdo MTL carregado, tamanho:', mtlContent.length, 'caracteres');

        // Verificar se MTLLoader está disponível
        if (typeof THREE.MTLLoader === 'undefined') {
            throw new Error('MTLLoader não está disponível');
        }

        const mtlLoader = new THREE.MTLLoader();
        
        // Configurar carregamento de texturas
        mtlLoader.loadTexture = function(url, onLoad, onProgress, onError) {
            console.log(`🎨 Carregando textura: ${url}`);
            
            const textureLoader = new THREE.TextureLoader();
            textureLoader.load(
                url,
                (texture) => {
                    console.log(`✅ Textura carregada: ${url}`);
                    texture.colorSpace = THREE.SRGBColorSpace;
                    texture.flipY = false;
                    onLoad(texture);
                },
                onProgress,
                (error) => {
                    console.error(`❌ Falha na textura ${url}:`, error);
                    // Usar textura fallback
                    const fallbackTexture = createFallbackTexture();
                    onLoad(fallbackTexture);
                }
            );
        };

        const materials = mtlLoader.parse(mtlContent);
        
        if (!materials) {
            throw new Error('Falha ao analisar arquivo MTL');
        }

        materials.preload();
        console.log(`✅ Materiais carregados: ${Object.keys(materials.materialsInfo || {}).length} materiais`);
        
        return materials;

    } catch (error) {
        console.error('💥 Erro nos materiais:', error);
        throw new Error('Falha no carregamento de materiais: ' + error.message);
    }
}

async function loadGeometry(zip, objFile, materials) {
    try {
        console.log('🔧 Iniciando carregamento de geometria...');
        
        const objContent = await zip.file(objFile).async('text');
        console.log('📐 Conteúdo OBJ carregado, tamanho:', objContent.length, 'caracteres');

        // Verificar se OBJLoader está disponível
        if (typeof THREE.OBJLoader === 'undefined') {
            throw new Error('OBJLoader não está disponível');
        }

        const objLoader = new THREE.OBJLoader();
        
        if (materials) {
            objLoader.setMaterials(materials);
        }

        const model = objLoader.parse(objContent);
        console.log('✅ Geometria carregada com sucesso');

        // Configurar sombras e propriedades dos materiais
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                // Se não há materiais ou é material básico, criar material melhor
                if (!materials || (child.material && child.material.isMeshBasicMaterial)) {
                    const newMaterial = new THREE.MeshLambertMaterial({
                        map: child.material ? child.material.map : null,
                        color: child.material ? child.material.color : 0x888888,
                        transparent: child.material ? child.material.transparent : false,
                        opacity: child.material ? child.material.opacity : 1.0
                    });
                    child.material = newMaterial;
                }
            }
        });

        return model;

    } catch (error) {
        console.error('💥 Erro na geometria:', error);
        throw new Error('Falha no carregamento da geometria: ' + error.message);
    }
}

function setupAndDisplayModel(model, mode) {
    // Adicionar à cena
    disposeScene(); // Limpar modelo anterior
    currentModel = model;
    scene.add(currentModel);

    // Configurar câmera
    setupModelCamera(currentModel);
    
    // Atualizar UI
    hideLoading();
    updateStatus(`✅ Modelo carregado ${mode}!`);
    updateModelStats();

    console.log(`🎉 Modelo carregado e exibido ${mode}!`);
}

function setupModelCamera(model) {
    const box = new THREE.Box3().setFromObject(model);
    box.getCenter(modelCenter);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 0.6;

    camera.position.copy(modelCenter).add(new THREE.Vector3(distance, distance * 0.5, distance));
    camera.lookAt(modelCenter);
    
    if (controls && controls.target) {
        controls.target.copy(modelCenter);
        controls.update();
    }

    console.log('📷 Câmera configurada para o modelo');
    console.log('📐 Dimensões:', size);
    console.log('🎯 Centro:', modelCenter);
}

// =============================================
// 🛠️ FUNÇÕES UTILITÁRIAS
// =============================================

function getURLParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

function showLoading(message) {
    if (loadingElement && progressElement) {
        loadingElement.classList.remove('hidden');
        progressElement.textContent = message;
    }
}

function hideLoading() {
    if (loadingElement) {
        loadingElement.classList.add('hidden');
    }
}

function updateStatus(message) {
    if (statusElement) {
        statusElement.textContent = message;
    }
}

function updateStats(message) {
    if (statsElement) {
        statsElement.textContent = message;
    }
}

function updateModelStats() {
    if (!currentModel || !statsElement) return;

    let meshCount = 0;
    let triangleCount = 0;
    let vertexCount = 0;

    currentModel.traverse((child) => {
        if (child.isMesh) {
            meshCount++;
            if (child.geometry) {
                if (child.geometry.index) {
                    triangleCount += child.geometry.index.count / 3;
                } else if (child.geometry.attributes.position) {
                    triangleCount += child.geometry.attributes.position.count / 3;
                }
                if (child.geometry.attributes.position) {
                    vertexCount += child.geometry.attributes.position.count;
                }
            }
        }
    });

    statsElement.textContent = `📊 Malhas: ${meshCount} | 🔺 Triângulos: ${Math.round(triangleCount)} | ⚫ Vértices: ${vertexCount}`;
}

function showError(message) {
    console.error('❌ Erro:', message);
    updateStatus('❌ ' + message);
    hideLoading();
}

function createFallbackTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    // Fundo cinza
    context.fillStyle = '#808080';
    context.fillRect(0, 0, 256, 256);
    
    // Texto indicativo
    context.fillStyle = '#666666';
    context.font = 'bold 16px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('TEXTURA', 128, 110);
    context.fillText('NÃO ENCONTRADA', 128, 130);
    context.font = '12px Arial';
    context.fillText('Usando fallback', 128, 150);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.flipY = false;
    return texture;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
    const moveSpeed = 0.5;
    
    switch (event.key.toLowerCase()) {
        case 'w':
            camera.position.z -= moveSpeed;
            break;
        case 's':
            camera.position.z += moveSpeed;
            break;
        case 'a':
            camera.position.x -= moveSpeed;
            break;
        case 'd':
            camera.position.x += moveSpeed;
            break;
        case 'q':
            camera.position.y -= moveSpeed;
            break;
        case 'e':
            camera.position.y += moveSpeed;
            break;
        case 'r':
            resetCamera();
            break;
    }
    
    // Manter a câmera olhando para o centro
    if (controls && controls.target) {
        camera.lookAt(controls.target);
    } else {
        camera.lookAt(scene.position);
    }
}

function startRenderLoop() {
    function animate() {
        requestAnimationFrame(animate);
        
        if (controls && controls.update) {
            controls.update();
        }
        
        renderer.render(scene, camera);
    }
    animate();
}

// =============================================
// 🚀 INICIALIZAÇÃO DA APLICAÇÃO
// =============================================

// Iniciar quando a página carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Exportar funções globais
window.resetCamera = resetCamera;
window.toggleWireframe = toggleWireframe;
window.toggleShadows = toggleShadows;
window.disposeScene = disposeScene;
window.toggleUI = toggleUI;
