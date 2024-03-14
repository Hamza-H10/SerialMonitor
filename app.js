var http = require('http');
var fs = require('fs');
var index = fs.readFileSync('index.html');

var SerialPort = require('serialport');
const parsers = SerialPort.parsers;

const parser = new parsers.Readline({
    delimiter: '\r\n'
});

var port; // Declare port variable

var app = http.createServer(function (req, res) {
    res.writeHead(200, { 
        'Content-Type': 'text/html' ,
        'Cache-Control': 'no-cache, no-store,    must-revalidate',
        'Pragma': 'no-cache',
        'Expires': 0
});
    res.end(index);
});

var io = require('socket.io').listen(app);

let globalbaudRate
// let globalbaudRate2 = globalbaudRate;



function connectToSerialPort(baudRate = 9600) {
// function connectToSerialPort(baudRate) {
    // baudRate = globalbaudRate2; 
    
    port = new SerialPort('COM4', {
        baudRate: parseInt(baudRate), // Set the baud rate based on the value received from the client
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        flowControl: false
    }, function (err) {
        if (err) {
            return console.log('Error: ', err.message);
        }
    });

    port.pipe(parser);

    parser.on('data', function (data) {
        io.emit('data', data);
    });

    console.log('Connected to COM4 port with baud rate: ' + baudRate);
}

io.on('connection', function (socket) {
    socket.on('ConnectToPort', function (data) {
        console.log(data);

        globalbaudRate = data.baudRate;

        if (data.status == '1') {
            connectToSerialPort(data.baudRate); // Pass the baud rate received from the client
            // connectToSerialPort(globalbaudRate2);
            console.log("Connected to COM4 port with baud rate: " + data.baudRate);
            // console.log("Connected to COM4 port with baud rate: " + globalbaudRate2);
        } else if (data.status == '0' && port) {
            port.close(function (err) {
                if (err) {
                    return console.log('Error on close: ', err.message);
                }
                console.log('Disconnected from COM4 port');
            });
        }
    });

        // Handle form submission
        socket.on('formSubmit', function (data) {
            console.log(data.command); // Log the command to the console
            if (port) {
                port.write(data.command + '\n'); // Send the command to the Arduino
            }
        });

        // io.on('connection', function(socket) {
            socket.on('chng_baudRate', function(data) {
                // var baudRate = data.baudRate;
                var globalbaudRate = data.baudRate;
                // Now you can use the baudRate value for other functionalities on the server
                // console.log('Received baudRate:', baudRate);
                console.log('Received baudRate:', globalbaudRate);
                // Perform other actions with the baudRate value
            });
        // });
});

// connectToSerialPort(data.baudRate);

app.listen(3000);

