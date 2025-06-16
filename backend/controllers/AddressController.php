<?php
require_once __DIR__ . '/../models/UserAddressModel.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class AddressController {
    private $addressModel;    public function __construct() {
        try {
            $this->addressModel = new UserAddressModel();
        } catch (Exception $e) {
            error_log('Error initializing AddressController: ' . $e->getMessage());
            throw $e;
        }
    }


    // GET /api/address -> obtine adresa utilizatorului
       public function getAddress() {
        try {
            //verific autentificarea
            $userData = AuthMiddleware::requireAuth();
            error_log('Getting address for user: ' . $userData->user_id);
            
            $address = $this->addressModel->getAddressByUserId($userData->user_id);
            error_log('Address found: ' . ($address ? 'yes' : 'no'));
            
            if ($address) {
                echo json_encode([
                    'success' => true,
                    'address' => $address
                ]);
            } else {
                //nu exista adresa->return un obiect gol
                echo json_encode([
                    'success' => true,
                    'address' => [
                        'country' => '',
                        'county' => '',
                        'city' => '',
                        'street' => '',
                        'postal_code' => ''
                    ]
                ]);
            }
        } catch (Exception $e) {
            error_log('Error getting address: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to get address: ' . $e->getMessage()]);
        }
    }

    //POST /api/address/update -> actualizeaza/insereaza adresa utilizatorului
    public function updateAddress() {
        try {
            //verifica autentificarea
            $userData = AuthMiddleware::requireAuth();
            error_log('User authenticated: ' . $userData->user_id);

            //obt datele json din request
            $input = json_decode(file_get_contents('php://input'), true);
            error_log('Input data: ' . print_r($input, true));
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid JSON data']);
                return;
            }

            //validare date obligatorii
            $required = ['country', 'city', 'street'];
            foreach ($required as $field) {
                if (empty($input[$field])) {
                    http_response_code(400);
                    echo json_encode(['error' => "Field '$field' is required"]);
                    return;
                }
            }

            $addressData = [
                'country' => trim($input['country']),
                'county' => trim($input['county'] ?? ''),
                'city' => trim($input['city']),
                'street' => trim($input['street']),
                'postal_code' => trim($input['postal_code'] ?? '')
            ];
            
            error_log('Address data to save: ' . print_r($addressData, true));

            //foloseste upsert(update+insert) pt a insera/actualiza
            $result = $this->addressModel->upsertAddress($userData->user_id, $addressData);
            error_log('Upsert result: ' . ($result ? 'success' : 'failed'));
            
            if ($result !== false) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Address updated successfully'
                ]);
            } else {
                throw new Exception('Failed to save address');
            }

        } catch (Exception $e) {
            error_log('Error updating address: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update address: ' . $e->getMessage()]);
        }
    }

    //sterge adresa utilizatorului
    public function deleteAddress() {
        // Verifică autentificarea
        $userData = AuthMiddleware::requireAuth();
        
        try {
            $result = $this->addressModel->deleteAddress($userData->user_id);
            
            if ($result) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Address deleted successfully'
                ]);
            } else {
                throw new Exception('Failed to delete address');
            }

        } catch (Exception $e) {
            error_log('Error deleting address: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete address']);
        }
    }
}
