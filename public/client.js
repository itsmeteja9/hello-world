const stages = [
  {
    number: '01',
    name: 'GitHub Commit',
    eyebrow: 'SOURCE EVENT',
    summary: 'A push to main starts the GitHub Actions workflow.',
    color: 'blue',
    icon: 'code',
    input: 'Push to main',
    action: 'GitHub Actions authenticates to Google Cloud with OIDC.',
    output: 'Commit SHA',
  },
  {
    number: '02',
    name: 'Terraform Infra',
    eyebrow: 'PROVISION FOUNDATION',
    summary: 'Terraform enables APIs and creates the Artifact Registry repository.',
    color: 'purple',
    icon: 'terraform',
    input: 'Terraform modules',
    action: 'Enable APIs and create the regional GAR repository.',
    output: 'GAR endpoint',
  },
  {
    number: '03',
    name: 'Docker Build',
    eyebrow: 'BUILD IMAGE',
    summary: 'The application is packaged as an immutable container image.',
    color: 'blue',
    icon: 'cube',
    input: 'Application source',
    action: 'Build and tag the container with the immutable commit SHA.',
    output: 'Container image',
  },
  {
    number: '04',
    name: 'Artifact Registry',
    eyebrow: 'STORE ARTIFACT',
    summary: 'The commit-tagged image is securely published to GAR.',
    color: 'teal',
    icon: 'registry',
    input: 'Tagged image',
    action: 'Push the image into the provisioned Artifact Registry repository.',
    output: 'Versioned artifact',
  },
  {
    number: '05',
    name: 'Cloud Run',
    eyebrow: 'DEPLOY SERVICE',
    summary: 'Terraform deploys the image and returns the public service URL.',
    color: 'green',
    icon: 'cloud',
    input: 'GAR image URI',
    action: 'Create or update Cloud Run and route traffic to the new revision.',
    output: 'HTTPS service URL',
  },
];

const activity = [
  { stage: 0, time: '00:01', text: 'Checked out main at commit 8f3a2c1' },
  { stage: 0, time: '00:05', text: 'Authenticated to Google Cloud via Workload Identity' },
  { stage: 1, time: '00:22', text: 'Terraform plan: 4 resources to add, 0 to change' },
  { stage: 1, time: '01:04', text: 'Created GAR repository: hello-world-images' },
  { stage: 2, time: '02:11', text: 'Built image: hello-world:8f3a2c1' },
  { stage: 3, time: '03:02', text: 'Published image to us-central1-docker.pkg.dev' },
  { stage: 4, time: '04:19', text: 'Cloud Run revision hello-world-00001 is ready' },
  { stage: 4, time: '04:28', text: 'Service URL returned successfully' },
];

const state = {
  activeStage: 0,
  statuses: stages.map(() => 'idle'),
  isRunning: false,
  completedRun: false,
  viewMode: 'guided',
  timers: [],
};

const elements = {
  stageGrid: document.querySelector('#stage-grid'),
  responsibilityGrid: document.querySelector('#responsibility-grid'),
  activityLog: document.querySelector('#activity-log'),
  progress: document.querySelector('#pipeline-progress'),
  summaryNumber: document.querySelector('#summary-number'),
  summaryEyebrow: document.querySelector('#summary-eyebrow'),
  summaryName: document.querySelector('#summary-name'),
  summaryText: document.querySelector('#summary-text'),
  runPipeline: document.querySelector('#run-pipeline'),
  runAgain: document.querySelector('#run-again'),
  runState: document.querySelector('#run-state'),
  servicePanel: document.querySelector('#service-panel'),
  serviceStatus: document.querySelector('#service-status'),
  servicePreview: document.querySelector('.service-preview'),
  revisionCopy: document.querySelector('#revision-copy'),
  guidedView: document.querySelector('#guided-view'),
  technicalView: document.querySelector('#technical-view'),
};

function icon(name) {
  return `<svg aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
}

function renderStages() {
  elements.stageGrid.innerHTML = stages
    .map((stage, index) => {
      const selected = state.activeStage === index;
      const status = state.statuses[index];
      const statusText = status === 'complete' ? '✓' : status === 'running' ? '•••' : '';

      return `
        <button
          class="stage-card stage-${stage.color} ${selected ? 'is-selected' : ''} status-${status}"
          type="button"
          data-stage="${index}"
          aria-pressed="${selected}"
        >
          <span class="stage-number">${stage.number}</span>
          <span class="stage-icon">${icon(stage.icon)}</span>
          <span class="stage-name">${stage.name}</span>
          <span class="stage-status" aria-label="Status: ${status}">${statusText}</span>
          <span class="stage-callout">${stage.eyebrow}</span>
        </button>
      `;
    })
    .join('');

  elements.stageGrid.querySelectorAll('[data-stage]').forEach((button) => {
    button.addEventListener('click', () => selectStage(Number(button.dataset.stage)));
  });
}

function technicalDetails(stage) {
  return `
    <dl>
      <div><dt>Input</dt><dd>${stage.input}</dd></div>
      <div><dt>Action</dt><dd>${stage.action}</dd></div>
      <div><dt>Output</dt><dd>${stage.output}</dd></div>
    </dl>
  `;
}

function renderResponsibilities() {
  elements.responsibilityGrid.innerHTML = stages
    .map(
      (stage, index) => `
        <article
          class="responsibility-card ${state.activeStage === index ? 'is-active' : ''}"
          data-responsibility="${index}"
          tabindex="0"
        >
          <div class="mini-icon stage-${stage.color}">${icon(stage.icon)}</div>
          <span>${stage.number}</span>
          <h3>${stage.name}</h3>
          ${
            state.viewMode === 'guided'
              ? `<p>${stage.summary}</p>`
              : technicalDetails(stage)
          }
        </article>
      `,
    )
    .join('');

  elements.responsibilityGrid.querySelectorAll('[data-responsibility]').forEach((card) => {
    const activate = () => selectStage(Number(card.dataset.responsibility));
    card.addEventListener('mouseenter', activate);
    card.addEventListener('focus', activate);
    card.addEventListener('click', activate);
  });
}

function renderActivity() {
  elements.activityLog.innerHTML = activity
    .map((entry) => {
      const stageStatus = state.statuses[entry.stage];
      const visible = stageStatus === 'running' || stageStatus === 'complete';
      const marker = visible && stageStatus === 'complete' ? '✓' : visible ? '›' : '·';
      const text = visible ? entry.text : 'Waiting for previous stage…';
      return `
        <div class="log-line ${visible ? 'is-visible' : ''}">
          <span>${marker}</span>
          <time>${entry.time}</time>
          <code>${text}</code>
        </div>
      `;
    })
    .join('');
}

function renderSummary() {
  const stage = stages[state.activeStage];
  elements.summaryNumber.textContent = stage.number;
  elements.summaryNumber.className = `summary-number summary-${stage.color}`;
  elements.summaryEyebrow.textContent = stage.eyebrow;
  elements.summaryName.textContent = stage.name;
  elements.summaryText.textContent = stage.summary;
  elements.progress.style.width = `${(state.activeStage / (stages.length - 1)) * 100}%`;
}

function setServiceView(mode) {
  const label = elements.servicePreview.querySelector('p');
  const headline = elements.servicePreview.querySelector('strong');

  if (mode === 'deploying') {
    elements.servicePanel.classList.remove('is-deployed');
    elements.serviceStatus.textContent = 'DEPLOYING';
    label.textContent = 'CLOUD RUN REVISION';
    headline.innerHTML = 'Shipping<span class="deploying-dots">…</span>';
    elements.revisionCopy.textContent = 'The pipeline is preparing the next application revision.';
    return;
  }

  elements.servicePanel.classList.add('is-deployed');
  elements.serviceStatus.textContent = 'LIVE';
  label.textContent = 'HELLO FROM CLOUD RUN';
  headline.innerHTML = 'It shipped. <span>✓</span>';
  elements.revisionCopy.textContent = 'This page is the application currently served by Cloud Run.';
}

function renderControls() {
  const primaryLabel = elements.runPipeline.querySelector('.button-label');
  const primaryIcon = elements.runPipeline.querySelector('.play-mark');

  if (state.isRunning) {
    primaryLabel.textContent = 'Pipeline running';
    primaryIcon.textContent = '';
    primaryIcon.className = 'button-spinner';
    elements.runAgain.textContent = 'Running…';
    elements.runAgain.disabled = true;
    elements.runState.textContent = 'RUNNING';
    elements.runState.classList.add('is-live');
  } else {
    primaryLabel.textContent = state.completedRun ? 'Run pipeline again' : 'Run pipeline demo';
    primaryIcon.textContent = '▶';
    primaryIcon.className = 'play-mark';
    elements.runAgain.textContent = state.completedRun ? 'Run again' : 'Start demo';
    elements.runAgain.disabled = false;
    elements.runState.textContent = state.completedRun ? 'SUCCESS' : 'READY';
    elements.runState.classList.remove('is-live');
  }
}

function render() {
  renderStages();
  renderResponsibilities();
  renderActivity();
  renderSummary();
  renderControls();
}

function selectStage(index) {
  state.activeStage = index;
  renderStages();
  renderResponsibilities();
  renderSummary();
}

function clearTimers() {
  state.timers.forEach(window.clearTimeout);
  state.timers = [];
}

function runPipeline() {
  clearTimers();
  state.isRunning = true;
  state.completedRun = false;
  state.activeStage = 0;
  state.statuses = stages.map(() => 'idle');
  setServiceView('deploying');
  render();

  stages.forEach((_, index) => {
    state.timers.push(
      window.setTimeout(() => {
        state.activeStage = index;
        state.statuses = state.statuses.map((status, statusIndex) => {
          if (statusIndex < index) return 'complete';
          if (statusIndex === index) return 'running';
          return status;
        });
        render();
      }, index * 1050),
    );

    state.timers.push(
      window.setTimeout(() => {
        state.statuses = state.statuses.map((status, statusIndex) =>
          statusIndex <= index ? 'complete' : status,
        );

        if (index === stages.length - 1) {
          state.isRunning = false;
          state.completedRun = true;
          setServiceView('live');
        }

        render();
      }, index * 1050 + 850),
    );
  });
}

function setViewMode(mode) {
  state.viewMode = mode;
  const guided = mode === 'guided';
  elements.guidedView.classList.toggle('is-active', guided);
  elements.technicalView.classList.toggle('is-active', !guided);
  elements.guidedView.setAttribute('aria-pressed', String(guided));
  elements.technicalView.setAttribute('aria-pressed', String(!guided));
  renderResponsibilities();
}

document.querySelector('#explore-stages').addEventListener('click', () => {
  document.querySelector('#pipeline').scrollIntoView({ behavior: 'smooth', block: 'center' });
  selectStage(0);
});

elements.runPipeline.addEventListener('click', runPipeline);
elements.runAgain.addEventListener('click', runPipeline);
elements.guidedView.addEventListener('click', () => setViewMode('guided'));
elements.technicalView.addEventListener('click', () => setViewMode('technical'));

document.querySelector('#service-url').textContent = window.location.origin;
setServiceView('live');
render();

window.addEventListener('beforeunload', clearTimers);
