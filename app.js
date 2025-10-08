// 🚀 VARIÁVEIS GLOBAIS OTIMIZADAS
let camera, scene, renderer, controls, object;
let modelCenter = new THREE.Vector3();
let textureCache = new Map();
let isWireframe = false;
let shadowsEnabled = true;
let renderMode = 'performance';
let ambientLight, mainLight, fillLight;
let stats = {
    meshes: 0,
    textures: 0,
    triangles: 0
};

// 📊 ELEMENTOS UI
let loadingElement, progressElement, statusElement, statsElement, lightSlider, lightValue;

// 🎯 INICIALIZAÇÃO DOS ELEMENTOS UI
function initUIElements() {
    loadingElement = document.getElementById('loading');
    progressElement = document.getElementById('progress');
    statusElement = document.getElementById('statusText');
    statsElement = document.getElementById('stats');
    lightSlider = document.getElementById('lightIntensity');
    lightValue = document.getElementById('lightValue');
}

// 🎯 CONFIGURAÇÃO DE CENA OTIMIZADA
function initScene() {
    initUIElements();
    
    // Cena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a12);
    
    // Câmera com configurações otimizadas
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 5000);
    camera.position.set(800, 400, 800);

    // 🔥 RENDERIZADOR ALTAMENTE OTIMIZADO
    renderer = new THREE.WebGLRenderer({ 
        antialias: false,
        powerPreference: 'high-performance',
        precision: 'mediump',
        alpha: false,
        stencil: false,
        depth: true
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.physicallyCorrectLights = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // 🎮 CONTROLES OTIMIZADOS
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.8;
    controls.enablePan = true;

    // 💡 SISTEMA DE ILUMINAÇÃO FORTE
    setupStrongLighting();

    // 📈 EVENT LISTENERS EFICIENTES
    setupEventListeners();
    
    updateStatus('🚀 Sistema Inicializado - Máxima Performance');
    updateStats();
}

// 💡 ILUMINAÇÃO FORTE - GARANTIR QUE O MODELO SEJA VISÍVEL
function setupStrongLighting() {
    // Limpar luzes existentes
    if (ambientLight) scene.remove(ambientLight);
    if (mainLight) scene.remove(mainLight);
    if (fillLight) scene.remove(fillLight);

    // 🔥 LUZ AMBIENTE FORTE (CRÍTICO)
    ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    // 🔥 LUZ DIRECIONAL MUITO FORTE
    mainLight = new THREE.DirectionalLight(0xffffff, 2.5);
    mainLight.position.set(500, 1000, 500);
    mainLight.castShadow = true;
    
    // Configurações de sombra otimizadas
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 2000;
    mainLight.shadow.camera.left = -800;
    mainLight.shadow.camera.right = 800;
    mainLight.shadow.camera.top = 800;
    mainLight.shadow.camera.bottom = -800;
    
    scene.add(mainLight);

    // 🔥 LUZ DE PREENCHIMENTO FORTE
    fillLight = new THREE.DirectionalLight(0xffffff, 1.5);
    fillLight.position.set(-500, 500, -500);
    scene.add(fillLight);

    updateLighting();
}

// 🎯 EVENT LISTENERS EFICIENTES
function setupEventListeners() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(onWindowResize, 100);
    });
    
    document.addEventListener('keydown', onKeyDown);
    if (lightSlider) {
        lightSlider.addEventListener('input', updateLighting);
    }
}

// 🔄 ATUALIZAÇÃO DE ILUMINAÇÃO
function updateLighting() {
    if (!lightSlider) return;
    
    const intensity = parseInt(lightSlider.value) / 100;
    if (lightValue) {
        lightValue.textContent = `${lightSlider.value}%`;
    }
    
    // 🔥 INTENSIDADES MANTIDAS ALTAS
    if (ambientLight) ambientLight.intensity = intensity * 1.0;
    if (mainLight) mainLight.intensity = intensity * 2.5;
    if (fillLight) fillLight.intensity = intensity * 1.5;
    
    updateStats();
}

// 🎮 FUNÇÕES DE CONTROLE
function resetCamera() {
    if (object && modelCenter) {
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        camera.position.set(
            modelCenter.x + maxDim * 1.5,
            modelCenter.y + maxDim * 0.5,
            modelCenter.z + maxDim * 1.5
        );
        camera.lookAt(modelCenter);
        controls.update();
        updateStatus('🎯 Câmera Resetada');
    }
}

function toggleWireframe() {
    isWireframe = !isWireframe;
    
    if (object) {
        object.traverse((child) => {
            if (child.isMesh) {
                child.material.wireframe = isWireframe;
                child.material.needsUpdate = true;
            }
        });
    }
    
    updateStatus(isWireframe ? '📐 Wireframe Ativo' : '🎨 Modo Sólido');
}

function toggleShadows() {
    shadowsEnabled = !shadowsEnabled;
    renderer.shadowMap.enabled = shadowsEnabled;
    if (object) {
        object.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = shadowsEnabled;
                child.receiveShadow = shadowsEnabled;
            }
        });
    }
    updateStatus(shadowsEnabled ? '🌑 Sombras Ativas' : '🌞 Sombras Inativas');
}

function toggleRenderMode() {
    renderMode = renderMode === 'performance' ? 'quality' : 'performance';
    
    if (renderMode === 'performance') {
        renderer.setPixelRatio(1);
        renderer.antialias = false;
    } else {
        renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
        renderer.antialias = true;
    }
    
    updateStatus(`🔄 Modo: ${renderMode === 'performance' ? 'Performance' : 'Qualidade'}`);
}

function disposeScene() {
    // Clear texture cache
    textureCache.forEach(texture => {
        if (texture && typeof texture.dispose === 'function') {
            texture.dispose();
        }
    });
    textureCache.clear();
    
    // Dispose of current object
    if (object) {
        object.traverse((child) => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => {
                            if (material && typeof material.dispose === 'function') {
                                material.dispose();
                            }
                        });
                    } else if (child.material && typeof child.material.dispose === 'function') {
                        child.material.dispose();
                    }
                }
            }
        });
        scene.remove(object);
        object = null;
    }
    
    updateStatus('🗑️ Cena Limpa - Memória Liberada');
    updateStats(0, 0, 0);
}

// 🎯 CRIAR TEXTURA DE FALLBACK
function createFallbackTexture(color = 0x808080) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    // Cor sólida como fallback
    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.fillRect(0, 0, 256, 256);
    
    // Adicionar um padrão para identificar texturas faltantes
    context.fillStyle = '#666666';
    context.font = '14px Arial';
    context.textAlign = 'center';
    context.fillText('TEXTURE NOT FOUND', 128, 128);
    context.font = '10px Arial';
    context.fillText('Usando fallback', 128, 145);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.flipY = false;
    texture.encoding = THREE.sRGBEncoding;
    return texture;
}

// 🔍 DEBUG DETALHADO DO CONTEÚDO DO ZIP
function debugZipContents(zip) {
    const files = Object.keys(zip.files);
    console.group('📦 Conteúdo do ZIP:');
    files.forEach(file => {
        const zipEntry = zip.files[file];
        console.log(`📄 ${file} (dir: ${zipEntry.dir})`);
    });
    console.groupEnd();
    
    // Encontrar e logar arquivos específicos
    const objFiles = files.filter(f => f.toLowerCase().endsWith('.obj'));
    const mtlFiles = files.filter(f => f.toLowerCase().endsWith('.mtl'));
    const textureFiles = files.filter(f => /\.(jpe?g|png|bmp|tga|webp)$/i.test(f));
    
    console.log(`🔍 OBJ files:`, objFiles);
    console.log(`🔍 MTL files:`, mtlFiles);
    console.log(`🔍 Texture files:`, textureFiles);
    
    return { objFiles, mtlFiles, textureFiles };
}

// 🎯 CARREGAMENTO DE MODELO COM CORREÇÃO DEFINITIVA
async function loadModel() {
    const fileUrl = getQueryParam('file');
    if (!fileUrl) {
        updateStatus('❌ Use: ?file=modelo.zip');
        return;
    }

    try {
        showLoading('🚀 Iniciando carga otimizada...');
        
        // 📦 CARREGAR ZIP
        updateStatus('📦 Baixando arquivo...');
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`);
        const zipData = await response.arrayBuffer();
        const zip = await JSZip.loadAsync(zipData);

        // 🔍 DEBUG DO CONTEÚDO
        const { objFiles, mtlFiles, textureFiles } = debugZipContents(zip);

        // 🔍 ENCONTRAR ARQUIVOS
        const objFile = objFiles[0];
        const mtlFile = mtlFiles[0];

        if (!objFile) throw new Error('OBJ não encontrado no ZIP');

        // 🎨 CARREGAR TEXTURAS COM CACHE
        showLoading('🎨 Cache de texturas...');
        const textureMap = await loadTexturesWithCache(zip, textureFiles);

        // 🔧 CARREGAR MATERIAIS - SOLUÇÃO DEFINITIVA COM LOADING MANAGER
        let materials = null;
        if (mtlFile) {
            showLoading('⚙️ Processando materiais...');
            materials = await loadOptimizedMaterials(zip, mtlFile, textureMap);
            
            if (!materials) {
                console.warn('⚠️ Continuando sem materiais...');
            }
        }

        // 🔥 CARREGAR GEOMETRIA
        showLoading('🔄 Carregando geometria...');
        
        const objContent = await zip.file(objFile).async('string');
        
        // Usar LoadingManager também para o OBJLoader
        const objLoadingManager = new THREE.LoadingManager();
        objLoadingManager.setURLModifier(createURLModifier(zip, textureMap));
        
        const objLoader = new THREE.OBJLoader(objLoadingManager);
        
        if (materials) {
            objLoader.setMaterials(materials);
        }

        // 🗑️ LIMPAR CENA ANTIGA
        if (object) {
            disposeScene();
        }

        object = objLoader.parse(objContent);
        scene.add(object);

        // 🔥 CORREÇÃO CRÍTICA: GARANTIR QUE MATERIAIS REAJAM À LUZ
        forceMaterialsToReactToLight(object);

        // 🎯 CONFIGURAÇÃO FINAL
        setupModelCamera(object);
        hideLoading();
        
        updateStatus(`✅ Modelo Otimizado! ${stats.meshes} malhas`);
        updateStats();

    } catch (error) {
        console.error('💥 Erro:', error);
        updateStatus(`❌ Erro: ${error.message}`);
        hideLoading();
    }
}

// 🔧 CRIAR URL MODIFIER PARA INTERCEPTAR REQUISIÇÕES
function createURLModifier(zip, textureMap) {
    return function(url) {
        const requestedName = url.split('/').pop().split('\\').pop();
        console.log(`🔗 URLModifier interceptou: "${requestedName}"`);
        
        // 🔍 BUSCA INTELIGENTE POR TEXTURAS
        let resolvedTexture = null;
        
        // 1. Busca direta pelo nome exato
        if (textureMap.has(requestedName)) {
            resolvedTexture = textureMap.get(requestedName);
            console.log(`✅ Textura encontrada (nome exato): ${requestedName}`);
        }
        // 2. Busca por nomes sem extensão
        else {
            const nameWithoutExt = requestedName.replace(/\.[^/.]+$/, "");
            const possibleExtensions = ['.jpeg', '.jpg', '.png', '.bmp', '.tga', '.webp'];
            
            for (const ext of possibleExtensions) {
                const possibleName = nameWithoutExt + ext;
                if (textureMap.has(possibleName)) {
                    resolvedTexture = textureMap.get(possibleName);
                    console.log(`✅ Textura encontrada (com extensão): ${possibleName}`);
                    break;
                }
            }
        }
        
        // 3. Se encontrou a textura, retorna como Blob URL
        if (resolvedTexture) {
            // Se já é uma textura carregada, cria um Blob URL a partir dela
            if (resolvedTexture.image && resolvedTexture.image.src) {
                return resolvedTexture.image.src;
            }
        }
        
        // 4. Fallback: tenta encontrar o arquivo no ZIP e criar Blob URL
        const textureFiles = Object.keys(zip.files).filter(f => 
            /\.(jpe?g|png|bmp|tga|webp)$/i.test(f)
        );
        
        const matchingFile = textureFiles.find(file => {
            const fileName = file.split('/').pop().split('\\').pop();
            return fileName === requestedName || 
                   fileName.replace(/\.[^/.]+$/, "") === requestedName.replace(/\.[^/.]+$/, "");
        });
        
        if (matchingFile) {
            try {
                const textureBlob = zip.file(matchingFile).async('blob').then(blob => {
                    const blobUrl = URL.createObjectURL(blob);
                    console.log(`✅ Criado Blob URL para: ${matchingFile}`);
                    return blobUrl;
                });
                // Retorna uma promise que será resolvida pelo Three.js
                return textureBlob;
            } catch (error) {
                console.warn(`❌ Erro ao criar Blob URL para ${matchingFile}:`, error);
            }
        }
        
        // 5. Último recurso: fallback
        console.warn(`❌ Textura não resolvida: ${requestedName}, usando fallback`);
        const fallbackTexture = createFallbackTexture();
        return fallbackTexture.image.src;
    };
}

// 🔥 CORREÇÃO CRÍTICA: FORÇAR MATERIAIS A REAGIR À LUZ
function forceMaterialsToReactToLight(object) {
    stats.meshes = 0;
    stats.triangles = 0;
    
    object.traverse((child) => {
        if (child.isMesh) {
            stats.meshes++;
            
            // 🔥 CONVERSÃO OBRIGATÓRIA DE MATERIAIS
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material = child.material.map(mat => convertToLightReactiveMaterial(mat));
                } else {
                    child.material = convertToLightReactiveMaterial(child.material);
                }
            }
            
            // Configurar sombras
            child.castShadow = shadowsEnabled;
            child.receiveShadow = shadowsEnabled;
            
            if (isWireframe) {
                child.material.wireframe = true;
            }
            
            // Estatísticas
            if (child.geometry) {
                stats.triangles += child.geometry.attributes.position.count / 3;
            }
        }
    });
    
    console.log(`🔧 Materiais convertidos: ${stats.meshes} malhas`);
}

// 🔄 CONVERSÃO PARA MATERIAL QUE REAGE À LUZ
function convertToLightReactiveMaterial(originalMat) {
    // Se já for um material que reage à luz, manter com intensidade aumentada
    if (originalMat.isMeshLambertMaterial || originalMat.isMeshPhongMaterial || 
        originalMat.isMeshStandardMaterial) {
        // Aumentar reflectividade para melhor visibilidade
        if (originalMat.isMeshStandardMaterial) {
            originalMat.roughness = 0.7;
            originalMat.metalness = 0.1;
        }
        return originalMat;
    }

    // 🔥 CONVERTER MeshBasicMaterial para MeshLambertMaterial
    if (originalMat.isMeshBasicMaterial) {
        console.log('🔧 Convertendo MeshBasicMaterial para MeshLambertMaterial');
        const newMat = new THREE.MeshLambertMaterial({
            map: originalMat.map,
            color: originalMat.color,
            transparent: originalMat.transparent,
            opacity: originalMat.opacity,
            side: THREE.DoubleSide
        });
        // Dispose do material antigo
        if (originalMat.dispose) originalMat.dispose();
        return newMat;
    }

    // 🔥 CONVERSÃO GENÉRICA PARA MeshLambertMaterial
    console.log('🔧 Convertendo material genérico para MeshLambertMaterial');
    const newMat = new THREE.MeshLambertMaterial({
        map: originalMat.map,
        color: originalMat.color || 0xffffff,
        transparent: originalMat.transparent || false,
        opacity: originalMat.opacity || 1.0,
        side: THREE.DoubleSide
    });
    
    if (originalMat.dispose) originalMat.dispose();
    return newMat;
}

// 🎨 CARREGAMENTO DE TEXTURAS COM CACHE - VERSÃO CORRIGIDA
async function loadTexturesWithCache(zip, textureFiles) {
    const textureMap = new Map();
    const textureLoader = new THREE.TextureLoader();
    
    console.log(`📁 Arquivos de textura encontrados:`, textureFiles);
    
    for (const textureFile of textureFiles) {
        const fileName = textureFile.split('/').pop().split('\\').pop();
        
        // 🔄 REUTILIZAR CACHE QUANDO POSSÍVEL
        if (textureCache.has(fileName)) {
            textureMap.set(fileName, textureCache.get(fileName));
            continue;
        }

        try {
            console.log(`⬇️ Carregando textura: ${fileName}`);
            const textureBlob = await zip.file(textureFile).async('blob');
            const textureUrl = URL.createObjectURL(textureBlob);
            
            const texture = await new Promise((resolve, reject) => {
                textureLoader.load(
                    textureUrl,
                    (texture) => {
                        // 🔥 CONFIGURAÇÕES CRÍTICAS PARA TEXTURAS
                        texture.flipY = false;
                        texture.encoding = THREE.sRGBEncoding;
                        texture.generateMipmaps = true;
                        texture.minFilter = THREE.LinearMipmapLinearFilter;
                        texture.magFilter = THREE.LinearFilter;
                        texture.wrapS = THREE.RepeatWrapping;
                        texture.wrapT = THREE.RepeatWrapping;
                        
                        console.log(`✅ Textura carregada: ${fileName}`);
                        URL.revokeObjectURL(textureUrl);
                        resolve(texture);
                    },
                    undefined,
                    (error) => {
                        console.error(`❌ Erro na textura ${fileName}:`, error);
                        URL.revokeObjectURL(textureUrl);
                        reject(error);
                    }
                );
            });
            
            textureMap.set(fileName, texture);
            textureCache.set(fileName, texture);
            
        } catch (error) {
            console.warn(`⚠️ Textura ${fileName} falhou, criando fallback:`, error);
            const fallbackTexture = createFallbackTexture();
            textureMap.set(fileName, fallbackTexture);
            textureCache.set(fileName, fallbackTexture);
        }
    }
    
    return textureMap;
}

// 🔧 CARREGAR MATERIAIS OTIMIZADOS - SOLUÇÃO DEFINITIVA COM LOADING MANAGER
async function loadOptimizedMaterials(zip, mtlFile, textureMap) {
    try {
        const mtlContent = await zip.file(mtlFile).async('string');
        
        console.log('🔍 Processando arquivo MTL:', mtlFile);
        
        // 🔥 CORREÇÃO CRÍTICA: Processar MTL para extrair APENAS nomes de arquivos
        const processedMTL = mtlContent
            .split('\n')
            .map(line => {
                // Processa todos os tipos de mapas: Kd, Ka, Ks, bump, etc.
                if (line.startsWith('map_') || line.startsWith('bump')) {
                    // Extrai apenas o nome do arquivo, ignorando caminhos completos
                    const matches = line.match(/(map_\w+|bump)\s+(.*[\\\/])?([^\\\/\r\n]+)/);
                    if (matches && matches[3]) {
                        return `${matches[1]} ${matches[3]}`;
                    }
                }
                return line;
            })
            .join('\n');
        
        console.log('📝 MTL Processado - Iniciando carregamento...');
        
        // 🔥 SOLUÇÃO DEFINITIVA: Usar LoadingManager com URLModifier
        const loadingManager = new THREE.LoadingManager();
        loadingManager.setURLModifier(createURLModifier(zip, textureMap));

        const mtlLoader = new THREE.MTLLoader(loadingManager);
        
        // Fazer o parse dos materiais
        const materials = mtlLoader.parse(processedMTL);
        
        if (!materials) {
            console.error('❌ Falha no parse do MTL');
            return null;
        }
        
        materials.preload();
        console.log(`✅ Materiais carregados com sucesso: ${Object.keys(materials.materialsInfo || {}).length} materiais`);
        
        return materials;
        
    } catch (error) {
        console.error('💥 Erro ao carregar MTL:', error);
        return null;
    }
}

// 🎯 CONFIGURAR CÂMERA DO MODELO
function setupModelCamera(object) {
    const box = new THREE.Box3().setFromObject(object);
    box.getCenter(modelCenter);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    camera.position.set(
        modelCenter.x + maxDim * 1.2,
        modelCenter.y + maxDim * 0.4,
        modelCenter.z + maxDim * 1.2
    );
    camera.lookAt(modelCenter);
    camera.far = maxDim * 10;
    camera.updateProjectionMatrix();
    
    controls.target.copy(modelCenter);
    controls.maxDistance = maxDim * 4;
    controls.update();
}

// 🛠️ FUNÇÕES UTILITÁRIAS
function getQueryParam(param) {
    return new URLSearchParams(window.location.search).get(param);
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

function updateStats(meshes = stats.meshes, textures = textureCache.size, triangles = stats.triangles) {
    if (statsElement) {
        statsElement.textContent = `📊 Malhas: ${meshes} | 🎨 Texturas: ${textures} | 🔺 Triângulos: ${Math.round(triangles/1000)}k`;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
    const moveSpeed = 40;
    switch (event.key.toLowerCase()) {
        case 'w': camera.position.z -= moveSpeed; break;
        case 's': camera.position.z += moveSpeed; break;
        case 'a': camera.position.x -= moveSpeed; break;
        case 'd': camera.position.x += moveSpeed; break;
        case 'q': camera.position.y -= moveSpeed; break;
        case 'e': camera.position.y += moveSpeed; break;
    }
}

// 🚀 INICIALIZAÇÃO OTIMIZADA
function init() {
    initScene();
    loadModel();
    
    // 🔥 LOOP DE RENDERIZAÇÃO OTIMIZADO
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
}

// 📅 INICIAR QUANDO A PÁGINA CARREGAR
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
