function Node(id, ip, ua, referer) {
    this.id = id;
    this.ip = ip;
    this.data = ko.observable({ua: ua, referer: referer});
};

function dashboardViewModel() {
    var self = this;
    self.nodes = ko.observableArray();
    self.selectedNode = ko.observable();
    self.socket;

    self.selectNode = function (node) {
        self.selectedNode(node);
    };

    self.alertNodes = function (node) {
       self.socket.emit('alert', 'derp');
    };
};

$().ready(function () {
    var socket = io.connect();
    var dvm = new dashboardViewModel();
    dvm.socket = socket;

    socket.on('addClient', function (data) {
        dvm.nodes.push(new Node(data.id, data.ip.address,data.ua, data.referer));        
    });

    socket.on('delClient', function (data) {
        for (var i=0;i<dvm.nodes().length; i++) {
            var node = dvm.nodes()[i];
            if (node.id === data.id) {
                dvm.nodes.remove(dvm.nodes()[i]);
                break;
            }
        }        
    });

    ko.applyBindings(dvm);
});
