CREATE DEFINER=`gmedia_democase2`@`%.%.%.%` PROCEDURE `sp_add_kary_danny`(IN nip numeric, IN nama varchar(200), IN alamat varchar(200), IN gend enum('L','P'), IN tgl_lahir date)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
		ROLLBACK;
    -- handle error and print message
		GET DIAGNOSTICS CONDITION 1  
		@err_no = MYSQL_ERRNO,  
		@errmsg = MESSAGE_TEXT;
		INSERT INTO log_trx_api (api,request,response) VALUES ("sp_add_kary_danny",CONCAT('{"nip":"',@nip,'","nama":"',@nama,'","alamat":"',@alamat,'","gend":"',@gend,'","tgl_lahir":"',DATE_FORMAT(@tgl_lahir, '%m/%d/%Y'),'"}'), @errmsg);
  END;

  START TRANSACTION;

  -- your SQL statements here
	INSERT INTO karyawan (nip, nama, alamat, gend, tgl_lahir) VALUES (@nip,@nama,@alamat,@gend,@tgl_lahir);
	INSERT INTO log_trx_api (api,request,response) VALUES ("sp_add_kary_danny",CONCAT('{"nip":"',@nip,'","nama":"',@nama,'","alamat":"',@alamat,'","gend":"',@gend,'","tgl_lahir":"',DATE_FORMAT(@tgl_lahir, '%m/%d/%Y'),'"}'), "Data karyawan berhasil dibuat.");
  COMMIT;
END