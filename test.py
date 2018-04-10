from ptpip import PtpIpConnection
from ptpip import PtpIpCmdRequest
from threading import Thread

# open up a PTP/IP connection, default IP and Port is host='192.168.1.1', port=15740
ptpip = PtpIpConnection()
ptpip.open(host='10.1.1.212')

# Start the Thread which is constantly checking the status of the camera and which is
# processing new command packages which should be send
thread = Thread(target=ptpip.communication_thread)
thread.daemon = True
thread.start()

# create a PTP/IP command request object and add it to the queue of the PTP/IP connection object
ptpip_cmd = PtpIpCmdRequest(cmd=0x9128, param1=0xffffffff, param2=0x0000)
ptpip_packet = ptpip.cmd_queue.append(ptpip_cmd)