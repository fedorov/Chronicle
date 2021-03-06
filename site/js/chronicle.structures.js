//
// A custom jqueryui plugin widget.
// based on: http://jqueryui.com/widget/
//
// This is part of the Chronicle Project.
// It accesses the couchdb database and shows
// various levels of detail.
//
// WIP 2014-01-31


$(function() {

  $.widget( "chronicle.structures", {
    // default options
    options : {
      // the chronicle series that holds the actual data and display
      // TODO: the contents of this could be factored out to the page level
      //  probably using $('body').data() as the container object
      series : null,

      seriesSelector : null,

      // callbacks
      change : null,

      // TODO: this should come from database (or somewhere)
      labelToName : {
        "SM" : "Semimembranous",
        "RF" : "Rectus Femoralis",
        "VLI" : "Vastus Lateralis and Intermedius",
        "TFL" : "Tensor Fasciae Latae",
        "SAR" : "Sartorius",
        "GRA" : "Gracilis",
        "ST" : "Semitendinosus",
        "BFL" : "Biceps Femoris Longus",
        "BFB" : "Biceps Femoris Brevis",
        "VM" : "Vastus Medialis",
        "ADD" : "All Adductors",
      },

    },


    // the constructor
    _create: function() {

      // Set the class and disable click
      this.element
        // add a class for theming
        .addClass( "chronicle-structure" )
        // prevent double click to select text
        .disableSelection();

      var structures = this;
      $(this.options.seriesSelector).bind('change', function(e) {
        structures._refresh();
      });
    },


    // events bound via _on are removed automatically
    // revert other modifications here
    _destroy: function() {

      // remove generated elements
      this._clearResults();

      this.element
        .removeClass( "chronicle-structures" )
        .enableSelection();
    },


    _clearResults: function() {
      // TODO: proper clearing
      $('div',this.element[0]).remove();
    },

    // called when created, and later when changing options
    _refresh: function() {

      // clear previous results
      this._clearResults();

      // Add the tree div
      this.tree = $( "<div>", {
         "class" : "chronicle-structures-tree",
         "id" : "structureTree",
      }).appendTo( this.element );

      var series = $(this.options.seriesSelector);
      var structure = this;

      var imageInstanceUIDs = $('body').data().imageInstanceUIDs;
      var controlPointDocuments = $('body').data().controlPointDocuments;
      var treeData = [];
      $.each(controlPointDocuments, function(index,controlPointDocument) {
        var muscleEntry = {};
        var muscleLabel = controlPointDocument.label;
        muscleEntry.text = muscleLabel;
        muscleEntry.data = muscleLabel;
        var name = structure.options.labelToName[muscleLabel];
        if (name) {
          muscleEntry.text = name;
        }
        var sliceIndices = [];
        var uids = Object.keys(controlPointDocument.instancePoints);
        $.each(uids, function(index,uid) {
          var child = {};
          child.icon = '../' + uid + '/image32.png';
          child.text = String(imageInstanceUIDs.indexOf(uid));
          child.data = uid;
          sliceIndices.push(child);
        });
        muscleEntry.children = sliceIndices;
        treeData.push(muscleEntry);
      });

      var tree = { 'core' : {} };
      tree.core.data = treeData;
      tree.plugins = [ "wholerow", "sort" ];
      /*
      tree.sort = function(a,b) {
        // TODO:
        var nodea = $('#structureTree').jstree('get_node', a);
        var nodeb = $('#structureTree').jstree('get_node', b);
        var na = Number(nodea.text);
        var nb = Number(nodeb.text);
        return (na<nb ? -1 : (nb<na ? 1 : 0));
      };
      */
      $('#structureTree').jstree(tree);

      $('#structureTree').on("changed.jstree", function (e, data) {
        if ( data.node.children.length > 0 ) {
          // selected a muscle, show the slices where it is defined
          $('#structureTree').jstree('close_all');
          $('#structureTree').jstree('open_node', data.selected);
          $('body').data().selectedStructure = data.node.data;
          $('body').trigger("selectedStructureChange");
        } else {
          // selected a slice, scroll to it
          $('body').data().imageInstanceUID = data.node.data;
          $('body').trigger("imageInstanceUIDChange");
        }
      });
    },


    // _setOptions is called with a hash of all options that are changing
    // always refresh when changing options
    _setOptions: function() {
      // _super and _superApply handle keeping the right this-context
      this._superApply( arguments );
      this._refresh();
    },

    // _setOption is called for each individual option that is changing
    _setOption: function( key, value ) {
      // prevent invalid color values
      if ( /red|green|blue/.test(key) && (value < 0 || value > 255) ) {
        return;
      }
      this._super( key, value );
    }
  });

});
