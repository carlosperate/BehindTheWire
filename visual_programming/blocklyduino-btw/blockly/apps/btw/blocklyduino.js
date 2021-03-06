/**
  * List of tab names.
  * @private
  */
var TABS_ = ['blocks', 'arduino', 'xml'];
var selected = 'blocks';

 /**
  * Switch the visible pane when a tab is clicked.
  * @param {string} id ID of tab clicked.
  */
function tabClick(id) {
  // If the XML tab was open, save and render the content.
  if (document.getElementById('tab_xml').className == 'tabon') {
    var xmlTextarea = document.getElementById('textarea_xml');
    var xmlText = xmlTextarea.value;
    var xmlDom = null;
    try {
      xmlDom = Blockly.Xml.textToDom(xmlText);
    } catch (e) {
      var q =
          window.confirm('Error parsing XML:\n' + e + '\n\nAbandon changes?');
      if (!q) {
        // Leave the user on the XML tab.
        return;
      }
    }
    if (xmlDom) {
      Blockly.mainWorkspace.clear();
      Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, xmlDom);
    }
  }

  // Deselect the checkbox, hide and revert peek changes
  var peek_code_checkbox = document.getElementById('peekCodeCheck');
  var peek_code_span = document.getElementById('peekCode');
  peek_code_checkbox.checked = false;
  peekArduinoCode();
  peek_code_span.style.display = 'none';

  // Deselect all tabs and hide all panes.
  for (var x in TABS_) {
    document.getElementById('tab_' + TABS_[x]).className = 'taboff';
    document.getElementById('content_' + TABS_[x]).style.display = 'none';
  }

  // Select the active tab.
  selected = id.replace('tab_', '');
  document.getElementById(id).className = 'tabon';
  // Show the selected pane.
  var content = document.getElementById('content_' + selected);
  content.style.display = 'block';
  renderContent();
   
  //if block planel display, show peek code checkbox
  if(selected == 'blocks') {
    peek_code_span.style.display = 'inline';
  }
}

 /**
  * Populate the currently selected pane with content generated from the blocks.
  */
function renderContent() {
  var content = document.getElementById('content_' + selected);
  // Initialize the pane.
  if (content.id == 'content_blocks') {
    // If the workspace was changed by the XML tab, Firefox will have performed
    // an incomplete rendering due to Blockly being invisible.  Rerender.
    Blockly.mainWorkspace.render();
    //Check if the arduino code peek is showing
    if(document.getElementById('arduino_code_peek').style.display != 'none' ) {
       renderArduinoCode(null);
    }
  } else if (content.id == 'content_xml') {
    // Initialize the pane.
    var xmlTextarea = document.getElementById('textarea_xml');
    var xmlDom = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
    var xmlText = Blockly.Xml.domToPrettyText(xmlDom);
    xmlTextarea.value = xmlText;
    xmlTextarea.focus();
  } else if (content.id == 'content_arduino') {
    var code = Blockly.Generator.workspaceToCode('Arduino');
    var arduinoTextarea = document.getElementById('textarea_arduino');
    arduinoTextarea.value = code
    arduinoTextarea.focus();
  }
}
 
 /**
  * Updates the arduino code in the text area based on the blocks
  * TODO: Need to get get this working correctly in Chrome
  */
function renderArduinoCodeStart(e) {
  //console.log('handleDragStart');
  if(e !== null) {
    //e.dataTransfer = e.originalEvent.dataTransfer;
    e.dataTransfer.setData('text/html', 'This text may be dragged');
  }
}
function renderArduinoCode(e) {
  //console.log('Other code');
  var ardu_code = document.getElementById('arduino_code');
  ardu_code.textContent = Blockly.Generator.workspaceToCode('Arduino');
  Prism.highlightElement(ardu_code);
  if(e !== null) {
    e.preventDefault();
  }
}

/**
 * Initialize Blockly.  Called on page load.
 * @param {!Blockly} blockly Instance of Blockly from iframe.
 */
function init(blockly) {
  window.Blockly = blockly;

  // Make the 'Blocks' tab line up with the toolbox.
  if (Blockly.Toolbox) {
    window.setTimeout(function() {
        document.getElementById('tab_blocks').style.minWidth =
            (Blockly.Toolbox.width - 38) + 'px';
            // Account for the 19 pixel margin and on each side.
      }, 1);
  }

  auto_save_and_restore_blocks();

  //load from url parameter (single param)
  //http://stackoverflow.com/questions/2090551/parse-query-string-in-javascript
  var dest = unescape(location.search.replace(/^.*\=/, '')).replace(/\+/g, " ");
  if(dest){
    load_by_url(dest);
  }
}

/**
 * Configure the Block panel to display the code on the right based on the state
 * of the checkbox "peekCodeCheck"
 */
function peekArduinoCode() {
  var ardu_code_peek = document.getElementById('arduino_code_peek');
  var block_div = document.getElementById('content_blocks');
  var peek_code_checkbox = document.getElementById('peekCodeCheck');
  var blocks_iframe = document.getElementById('iframe_blocks');

  if(peek_code_checkbox.checked) {
    // Deselect all tabs and panels
    for(var x in TABS_) {
      document.getElementById('tab_' + TABS_[x]).className = 'taboff';
      document.getElementById('content_' + TABS_[x]).style.display = 'none';
    }

    // Set Blocks tab
    document.getElementById('tab_blocks').className = 'tabon';

    // Rearrange panels for blocks and arduino code
    block_div.style.display = 'inline-block';
    block_div.className = 'content_block_peek';
    ardu_code_peek.style.display = 'inline-block';

    // Regenerate arduino code and ensure every click does as well
    // TODO: not quite working in Chrome
    renderArduinoCode(null);
    //Blockly.addChangeListener(renderArduinoCode);
    blocks_iframe.contentDocument.addEventListener('click', renderArduinoCode, false);
    blocks_iframe.contentDocument.addEventListener('dragstart', renderArduinoCodeStart, false);
    blocks_iframe.contentDocument.addEventListener('dragend', renderArduinoCode, false);
    blocks_iframe.contentDocument.addEventListener('dragover', renderArduinoCode, false);
    blocks_iframe.contentDocument.addEventListener('dragleave', renderArduinoCode, false);
    blocks_iframe.contentDocument.addEventListener('drop', renderArduinoCode, false);
    blocks_iframe.contentDocument.addEventListener('dragenter', renderArduinoCode, false);
  } else {
    // Remove action listeners
    // TODO: not quite working in Chrome
    //Blockly.removeChangeListener(renderArduinoCode);
    blocks_iframe.contentDocument.removeEventListener('click', renderArduinoCode, false);
    blocks_iframe.contentDocument.removeEventListener('dragstart', renderArduinoCodeStart, false);
    blocks_iframe.contentDocument.removeEventListener('dragend', renderArduinoCode, false);
    blocks_iframe.contentDocument.removeEventListener('dragover', renderArduinoCode, false);
    blocks_iframe.contentDocument.removeEventListener('dragleave', renderArduinoCode, false);
    blocks_iframe.contentDocument.removeEventListener('drop', renderArduinoCode, false);
    blocks_iframe.contentDocument.removeEventListener('dragenter', renderArduinoCode, false);

    // Restore to original state
    ardu_code_peek.style.display = 'none';
    block_div.className = 'content_block';
    block_div.style.display = 'block';

    // Deselect all tabs and panels
    for (var x in TABS_) {
      document.getElementById('tab_' + TABS_[x]).className = 'taboff';
      document.getElementById('content_' + TABS_[x]).style.display = 'none';
    }

    // Select original block tab and panel
    document.getElementById('tab_' + selected).className = 'tabon';
    document.getElementById('content_' + selected).style.display = 'block';
  }
}
